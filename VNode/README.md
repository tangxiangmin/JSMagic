

vnode相关的一些技术实现
=== 

包括
* vnode2DOM，将vnode转换为DOM节点
* vnode2HTML，将vnode转换为HTML字符串
* diff算法，可分为递归实现（Vue）和循环实现（React Fiber）

## vnode
```js
// vnode实际上就是一个用于描述UI的对象，包含一些基本属性
// type：节点的类型
// props：接收到的参数，如style、onClick这些
function createVNode(type, props = {}, children = []) {
    return {
        type,
        props,
        children
    }
}
```
然后用`createVNode`来描述一个简单的视图，页面结构如下
```html
<div>
    <h1>hello title</h1>
    <ul class="list-simple">
        <li>1</li>
        <li>2</li>
        <li>3</li>
    </ul>
</div>
```
测试一下
```js
let data = {
    title: 'hello vnode',
    list: [1, 2, 3]
}
createRoot(data)
function createRoot(data) {
    let listItem = data.list.map(item => {
        return createVNode('li', {
            onClick() {
                console.log(item)
            }
        }, [item])
    })
    let list = createVNode('ul', {
        class: 'list-simple',
    }, listItem)

    let title = createVNode('h1', {}, [data.title])
    let root = createVNode('div', {}, [title, list])
    return root
}
```
可以看见，我们通过`type`描述需要渲染的标签，通过`prpos`描述样式、事件等属性，通过`children`描述子节点

## VNode2DOM
当我们将整个UI通过vnode树描述之后，我们还需要将其渲染为真实的DOM节点，最直观的方法是使用递归
```js
function VNode2DOM(root, parentDOM) {
    let { type, props, children } = root
    // 将当前vnode渲染为对应的DOM节点
    let dom
    if (type) {
        dom = document.createElement(type)
        for (var key in props) {
            setAttribute(dom, key, props[key])
        }
    } else {
        dom = document.createTextNode(root)
    }
    Array.isArray(children) && children.forEach(child => {
        VNode2DOM(child, dom)
    })
    // 将当前节点插入节点
    if (parentDOM) {
        parentDOM.appendChild(dom)
    }
    return dom
    // 向dom元素增加属性
    function setAttribute(el, prop, val) {
        // 处理事件
        let isEvent = prop.indexOf('on') === 0
        if (isEvent) {
            let eventName = prop.slice(2).toLowerCase()
            el.addEventListener(eventName, val)
        } else {
            el.setAttribute(prop, val)
        }
    }
}
```
测试一下，可以看见页面渲染了真实的DOM节点，同时正确添加了props属性
```js
let root = createRoot()
let dom = VNode2DOM(root, null)
document.body.appendChild(dom)
```

## VNode2HTML
在ssr中，我们需要的不是DOM节点，而是HTML字符串，同样适用递归来实现，由于构建一个vnode的html片段需要知道其全部子节点的html片段，因此此处使用后序遍历。
此外，由于服务端渲染并不需要获取事件等属性，我们可以将其过滤掉
```js
function VNode2HTML(root) {
    let { type, props, children } = root

    let sub = '' // 获取子节点渲染的html片段
    Array.isArray(children) && children.forEach(child => {
        sub += VNode2HTML(child)
    })

    let el = '' // 当前节点渲染的html片段
    if (type) {
        let attrs = ''
        for (var key in props) {
            attrs += getAttr(key, props[key])
        }
        el += `<${type}${attrs}>${sub}</${type}>` // 将子节点插入当前节点
    } else {
        el += root // 纯文本节点则直接返回
    }

    return el
    function getAttr(prop, val) {
        // 渲染HTML，我们不需要 事件 等props
        let isEvent = prop.indexOf('on') === 0
        return isEvent ? '' : ` ${prop}="${val}"`
    }
}
```
测试一下
```js
let html = VNode2HTML(root)
console.log(html)
// app2.innerHTML = html
// 输出结果为
// <div><h1>hello vnode</h1><ul class="list-simple"><li>1</li><li>2</li><li>3</li></ul></div>
```

可以看见，`VNode2DOM`和`VNode2HTML`都可以达到将vnode描述的UI渲染出来的目的，但是`VNode2DOM`更加直观且灵活，因此`VNode2HTML`主要用于服务端渲染的场景，而`VNode2DOM`可以在浏览器端直接通过DOM接口渲染

## 视图更新，递归diff
当vnode发生变化时，我们可以通过重新渲染根节点来更新视图。但是，当vnode结构比较庞大时，我们就不得不考虑全部重新渲染所带来的性能问题。

由于我们在初始化的时候构建了全部的DOM节点，在vnode发生变化时的理想状态是：我们只更新发生了变化的那些vnode，其余未变化的vnode，我们没必要又重新构建一次。

因此现在问题转化为如何找到那些发生了变化的vnode。解决这个问题的算法就被称为`diff`：从根节点开始，依次对比并更新新旧vnode树上的节点，并尽可能地复用DOM，避免额外开销。

为了性能和效率的均衡，diff算法遵循下面约定
* 只对比同一层级的节点
* 不同type的节点对应类型的DOM，需要完全更新当前节点及其子节点树
* 相同type的节点则检测props是否变化，只更新发生了变化的属性，如果props未变化，则不进行任何更改

基于这些约定，对于vnode树中的某个节点而言，可能发生的变化有：删除、新增、更新节点属性，基于此我们来实现diff算法。

整个diff算法分为两步，
* 首先遍历vnode树，收集变化的节点，
* 然后将收集的变化更新到视图上

整个diff的大致使用方式是
```js
let root2 = createRoot({
    title: 'change title', // 之前的title为hello vnode
    list: [3, 2] // 之前的list为[1,2,3]
})

var patches = diff(root, root2)
console.log(patches) // 可以看见变化的节点

// 将辩护更新到视图上
doPatch(patches)
```

### diff
```js
// 定义节点可能发生的变化
const [REMOVE, REPLACE, INSERT, UPDATE] = [0, 1, 2, 3];

function diff(oldNode, newNode, patches = []) {
    let patch;
    if (!newNode) {
        // 旧节点及其子节点都将移除
        patch = { type: REMOVE, oldNode };
    } else if (!oldNode) {
        // 当前节点与其子节点都将插入
        patch = { type: INSERT, newNode };
        diffChildren(null, newNode.children, patches);
    } else if (oldNode.type !== newNode.type) {
        // 使用新节点替换旧节点
        patch = { type: REPLACE, oldNode, newNode };
        // 新节点的字节点都需要插入
        diffChildren(null, newNode.children, patches);
    } else {
        // 如果存在有变化的属性，则使用新节点的属性更新旧节点
        let attrs = diffAttr(oldNode.props, newNode.props) // 发生变化的属性
        if (Object.keys(attrs).length > 0) {
            patch = { type: UPDATE, oldNode, newNode, attrs };
        } else {
            newNode.$el = oldNode.$el // 直接复用旧节点
        }
        // 继续比较子节点
        diffChildren(oldNode.children, newNode.children, patches);
    }
    // 收集变化
    patch && patches.push(patch)
    return patches
}

function diffAttr(oldAttrs, newAttrs) {
    let attrs = {};
    // 判断老的属性中和新的属性的关系
    for (let key in oldAttrs) {
        if (oldAttrs[key] !== newAttrs[key]) {
            attrs[key] = newAttrs[key]; // 有可能还是undefined
        }
    }
    for (let key in newAttrs) {
        // 老节点没有新节点的属性
        if (!oldAttrs.hasOwnProperty(key)) {
            attrs[key] = newAttrs[key];
        }
    }
    return attrs;
}

function diffChildren(oldChildren, newChildren, patches) {
    let count = 0;
    // 比较新旧子树的节点
    if (oldChildren && oldChildren.length) {
        oldChildren.forEach((child, index) => {
            count++;
            diff(child, (newChildren && newChildren[index]) || null, patches);
        });
    }

    // 如果还有未比较的新节点，继续进行diff将其标记为INSERT
    if (newChildren && newChildren.length) {
        while (count < newChildren.length) {
            diff(null, newChildren[count++], patches);
        }
    }
}
```

### patch
然后将收集的变化更新到视图上
```js
// 将变化更新到视图上
function doPatch(patches) {
    function createDOM(node) {
        let type = node.type
        return isTextNode(type) ?
            document.createTextNode(node.props.nodeValue) :
            document.createElement(type)
    }
    function setAttributes(vnode, attrs) {
        if (isTextNode(vnode.type)) {
            vnode.$el.nodeValue = vnode.props.nodeValue
        } else {
            let el = vnode.$el
            Object.keys(attrs).forEach(key => {
                setAttribute(el, key, attrs[key])
            });
        }
    }

    // 特定类型的变化，需要重新生成DOM节点，
    // 由于无法保证patches的顺序，因此此处提前生成
    const beforeCommit = {
        [REMOVE]: function removeChild(oldNode, newNode) {
        },
        [REPLACE]: function replaceChild(oldNode, newNode) {
            newNode.$el = createDOM(newNode)
        },
        [UPDATE]: function updateNode(oldNode, newNode) {
            // 复用旧的DOM节点，只需要更新必要的属性即可
            newNode.$el = oldNode.$el
        },
        [INSERT]: function insertNode(oldNode, newNode) {
            newNode.$el = createDOM(newNode)
        }
    };

    const commit = {
        [REMOVE]: function removeChild(oldNode, newNode) {
            oldNode.$parent.$el.removeChild(oldNode.$el)
        },
        [REPLACE]: function replaceChild(oldNode, newNode) {
            let parent = oldNode.$parent.$el
            let old = oldNode.$el
            let el = newNode.$el

            // 新插入的节点上添加属性
            setAttributes(newNode, newNode.props)
            parent.insertBefore(el, old);
            parent.removeChild(old);
        },
        [UPDATE]: function updateNode(oldNode, newNode) {
            // 只需要更更新diff阶段收集到的需要变化的属性
            setAttributes(newNode, newNode.attrs)
        },
        [INSERT]: function insertNode(oldNode, newNode) {
            // 新插入的节点上添加属性
            setAttributes(newNode, newNode.props)
            newNode.$parent.$el.appendChild(newNode.$el);
        }
    }
    // 首先对处理需要重新创建的DOM节点
    patches.forEach(patch => {
        const { type, oldNode, newNode } = patch
        let handler = beforeCommit[type];
        handler && handler(oldNode, newNode);
    })

    // 将每个变化更新到真实的视图上
    patches.forEach(patch => {
        const { type, oldNode, newNode } = patch
        let handler = commit[type];
        handler && handler(oldNode, newNode);
    })
}
```
可以看见在`doPatch`操作中，我们需要获取vnode的DOM实例和其父节点的引用，因此我们需要对之前的`createVNode`和`VNode2DOM`稍微修改一下
```js
function createVNode(type, props = {}, children = []) {
    let vnode = {type,props}
    vnode.children = children.map(child => {
        child.$parent = vnode // 保存对父节点的引用
        return child
    })
    return vnode
}
function VNode2DOM(root, parentDOM) {
    // ...
    root.$el = dom
    return dom
}
```

### 代码优化：抛弃VNode2DOM，合并初始化和更新
在上面的例子中，我们按照下面的流程实现应用
* 首先使用`createRoot(data)`初始化根节点`root`，并调用`VNode2DOM(root)`将vnode渲染为DOM节点
* 当`data`变化时，重新调用`createRoot(data2)`获取新的根节点`root2`，并通过`diff(root, root2)`获取新旧节点树中的变化`patchs`，最后通过`doPatch(patchs)`将变化更新在视图上

整个过程看起来比较简明，但可以发现`VNode2DOM`与`doPatch`中的初始化DOM节点的逻辑是重复的。换个思路，初始化的时候，可以看做是新旧点与一个为null的旧节点进行diff操作。

因此，我们现在可以直接跳过`VNode2DOM`，将初始化与`diff`的过程放在一起。
```js
root = createRoot({
    title: 'hello vnode',
    list: [1, 2, 3]
})
let patches = diff(null, root)
root.$parent = {
    $el: app
}
doPatch(patches)

// 视图更新时与上面相同的例子相同
// let patches =diff(root, root2) 
// doPatch(patches)
```
就这样，我们只需要为根节点手动添加一个`root.$parent.$el`属性用于挂载，除此之外就不再需要`VNode2DOM`这个方法（尽管这个方法是了解vnode映射为真实DOM最简单直观的实现了）

### diff算法优化：尽可能对比type相同的节点

在上面的diff算法中，我们在对比新旧节点时，是通过相同的索引值在父元素中的进行对比的，当两个节点的类型不相同时，会标记为`REPLACE`，在`patch`时会移除旧节点，同时在原位置插入节点。

考虑下面问题，当子节点列表从`[h1, ul]`变成了`[h1,p,ul]`时，我们的算法会将新节点中的p标记为`REPLACE`，将ul标记为`INSERT`，这显然不能达到性能上的优化，最理想的状态是直接在第二个位置插入p标签即可。

这个问题可以转换为：在某些时刻，我们不能简单地通过默认的索引值来查找并对比新旧节点，反之，我们应该尽可能去对比子节点中`vnode.type`相同的节点。

（感谢我们将整个diff过程分成了`diff`和`doPatch`两个阶段，我们现在只需要修改`diffChildren`方法中的一些逻辑即可~）

以下面例子来说，
```
// 这里列举的abcde都是指不同的type
oldChildren = [a,b,c,d] 
newChildren = [b,e,d,c]
// 为了尽可能地复用旧节点，理想状态是复用b、d，删除a，在指定位置插入d之前插入e，将c移动到d之后，整个操作共计3步。

// 我们上面的具体例子中[h1, ul] -> [h1, p, ul]
// 理想状态应该是直接将p插入ul节点之前，只需要一步操作
```
因此我们重新实现一个`diffChildren`方法
```js
// 尽可能地与相同type的节点进行比较
// 在这种逻辑下，会尽可能地按顺序复用子节点中类型相同的节点
// 整个算法的时间复杂度为O(n)，空间复杂度也为O(n)
// 注意在这种策略下不会再产生REPLACE类型的patch，而是直接将REPLACE拆分成了INSERT新节点和REMOVE旧节点的两个patch，对于doPatch阶段没有影响
function diffChildrenByType(oldChildren, newChildren, patches) {
    let map = {}
    oldChildren.forEach(child => {
        let { type } = child
        if (!map[type]) map[type] = []
        map[type].push(child)
    })

    for (let i = 0; i < newChildren.length; ++i) {
        let cur = newChildren[i]
        // 按顺序找到第一个类型相同的元素并复用，这种方式存在的问题是当两个类型相同的节点仅仅是调换位置，他们也会进行UPDATE
        // 针对这个问题，可以进一步判断，找到类型相同且props和children最接近的元素，从而避免上面的问题，但是这样做会增加时间复杂度
        // 因此，对于类型相同且顺序可能发生变化的节点，我们需要额外的手段来检测重复的节点，一种方法是使用语义化的标签，减少类型相同的标签，二是使用key
        if (map[cur.type] && map[cur.type].length) {
            let old = map[cur.type].shift()
            diff(old, cur, patches)
        } else {
            // 由于部分操作如INSERT依赖最终children的顺序，因此需要保证patches的顺序
            // 此处对于同一层级的节点而言，在前面的节点会先进入patches队列，因此会先插入
            diff(null, cur, patches)
        }
    }
    // 剩余未被使用的旧节点，将其移除
    Object.keys(map).forEach(type => {
        let arr = map[type]
        arr.forEach(old => {
            diff(old, null, patches)
        })
    })
}
```

测试一下
```js
function diffChildren(oldChildren, newChildren, patches){
    // diffChildrenByIndex(oldChildren, newChildren, patches) // 根据索引值查找并diff节点
    diffChildrenByType(oldChildren, newChildren, patches) // 根据type查找并diff节点
}
// 变化[h1, ul] -> [h1, p, ul]
```
经过测试可以发现，在上面的例子中`diffChildrenByType`会产生2个`INSERT`类型的patch，而`diffChildrenByIndex`1个`REPLACE`和8个`INSERT`patch，尽管这个测试用例有点极端，


### 使用key避免原地复用

在`diffChildrenByType`中我们提到了相同类型元素顺序调换会导致两个元素都进行UPDATE的问题，我们可以在创建节点时手动为节点添加一个唯一标识，从而保证在不同的顺序中也能快速找到该节点，按照行规我们将这个唯一标识命名为`key`。

接下来对`craeteVNode`和`diffChildrenByType`稍作修改，优先根据对比key相同的节点，然后再对比类型相同的节点
```js
// 在diffChildrenByType的基础上增加了根据key查找旧节点的逻辑
// 根据type和key来进行判断，避免同类型元素顺序变化导致的不必要更新
function diffChildrenByKey(oldChildren, newChildren, patches) {
    newChildren = newChildren.slice() // 复制一份children，避免影响父节点的children属性
    // 找到新节点列表中带key的节点
    let keyMap = {}
    newChildren.forEach((child, index) => {
        let { key } = child
        // 只有携带key属性的会参与同key节点的比较
        if (key !== undefined) {
            if (keyMap[key]) {
                console.warn(`请保证${key}的唯一`, child)
            } else {
                keyMap[key] = {
                    vnode: child,
                    index
                }
            }
        }
    })

    // 在遍历旧列表时，先比较类型与key均相同的节点，如果新节点中不存在key相同的节点，才会将旧节点保存起来
    let typeMap = {}
    oldChildren.forEach(child => {
        let { type, key } = child
        // 先比较类型与key均相同的节点
        let { vnode, index } = (keyMap[key] || {})
        if (vnode && vnode.type === type) {
            newChildren[index] = null // 该节点已被比较，需要弹出
            // newChildren.splice(index, 1) // 该节点已被比较，需要弹出
            delete keyMap[key]
            diff(child, vnode, patches)
        } else {
            // 将剩余的节点保存起来，与剩余的新节点进行比较
            if (!typeMap[type]) typeMap[type] = []
            typeMap[type].push(child)
        }
    })

    // 剩下的节点处理与diffChildrenByType相同，此时key相同的节点已被比较
    for (let i = 0; i < newChildren.length; ++i) {
        let cur = newChildren[i]
        if (!cur) continue; // 已在在前面与此时key相同的节点进行比较
        // ... 找到一个类型相同的节点进行比较
    }
    // ... 剩余未被使用的旧节点，将其移除
}

```

同时增加一种MOVE的patch类型，在diff方法中，如果新旧节点在父节点中的位置不一致，则会提交一个patch，此外我们需要在vnode上增加一个index属性，用于记录新旧节点在父节点中的位置
```js
function createVNode(type, props = {}, children = []) {
    // ...
    let key = props.key 
    delete props.key
    vnode.key = key // 增加key
    vnode.children = children.map((child, index) => {
        // ...
        child.index = index // 增加index记录在该节点的索引值
        return child
    })
}

function diff(oldNode, newNode, patches = []) {
    // 新旧节点类型相同但索引值不一致，则表示节点复用，节点需要移动位置，进行MOVE
    if (oldNode.index !== newNode.index) {
        patches.push({ type: MOVE, oldNode, newNode })
    }
    return patches
}
```
最后，在`doPatch`阶段需要为`MOVE`类型的节点增加DOM更新处理方法
```js
// 将节点插入父节点，如果节点存在父节点中，则调用insertBefore执行的是移动操作而不是复制操作，
// 因此也可以用来进行MOVE操作
function insertDOM(newNode) {
    let parent = newNode.$parent.$el
    let children = parent.children

    let el = newNode.$el
    let after = children[newNode.index]

    after ? parent.insertBefore(el, after) : parent.appendChild(el)
}
// 需要MOVE的元素按照新的索引值排序，保证排在前面的先进行移动位置的操作
patches
    .filter(patch => patch.type === MOVE)
    .sort((a, b) => a.index - b.index)
    .forEach(patch => {
        const { oldNode, newNode } = patch
        insertDOM(newNode)
    })
```

测试一下
```js
function testKey() {
    let list1 = createList([1, 2, 3], true) // true 使用元素值作为key
    let patches = diff(null, list1)
    list1.$parent = {
        $el: app
    }
    doPatch(patches)
    btn.onclick = function () {
        let list2 = createList([4, 3, 2, 1], true)
        let patches = diff(list1, list2)
        console.log(patches)  // 查看收集的变化
        doPatch(patches)
    }
}
```

同样进行上面的操作
* `diffChildrenByKey`包含3个MOVE操作（1、2、3节点不会创建新的文本节点，而是移动li节点），两个INSERT操作（一个li节点和一个文本节点）
* `diffChildrenByType`包含3个UPDATE操作（更新前三个文本节点），两个INSERT操作
* `diffChildrenByIndex`，由于循环节点的类型一致，导致该方法的diff结果与`diffChildrenByType`相同

可以看见，增加key之后，会尽可能地复用元素节点并移动位置，而不是在原地复用元素节点并更新文本节点（移动位置在性能上并不见得优于原地更新文本节点），因此
> 使用key并不一定能带来性能上的提升，而是为了避免原地复用元素节点带来的影响。