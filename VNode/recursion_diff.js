/**
 * 整个diff算法分为两步
 * 首先遍历vnode树，收集变化的节点
 * 然后将收集的变化更新到视图上
 */


// 定义节点可能发生的变化
const [REMOVE, REPLACE, INSERT, UPDATE, MOVE] = [0, 1, 2, 3, 4];


// =====diff过程，收集变化==== //
function diff(oldNode, newNode, patches = []) {
    if (!newNode) {
        // 旧节点及其子节点都将移除
        patches.push({ type: REMOVE, oldNode })
    } else if (!oldNode) {
        // 当前节点与其子节点都将插入
        patches.push({ type: INSERT, newNode })
        diffChildren([], newNode.children, patches);
    } else if (oldNode.type !== newNode.type) {
        // 使用新节点替换旧节点
        patches.push({ type: REPLACE, oldNode, newNode })
        // 新节点的字节点都需要插入
        diffChildren([], newNode.children, patches);
    } else {
        // 如果存在有变化的属性，则使用新节点的属性更新旧节点
        let attrs = diffAttr(oldNode.props, newNode.props) // 发生变化的属性
        if (Object.keys(attrs).length > 0) {
            patches.push({ type: UPDATE, oldNode, newNode, attrs })
        }

        // 节点需要移动位置
        if (oldNode.index !== newNode.index) {
            patches.push({ type: MOVE, oldNode, newNode })
        }

        newNode.$el = oldNode.$el // 直接复用旧节点
        // 继续比较子节点
        diffChildren(oldNode.children, newNode.children, patches);
    }
    // 收集变化
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

// 对比不同策略的diff算法带来的DOM操作差异
function diffChildren(oldChildren, newChildren, patches) {
    // diffChildrenByIndex(oldChildren, newChildren, patches)
    // diffChildrenByType(oldChildren, newChildren, patches)
    diffChildrenByKey(oldChildren, newChildren, patches)
}

// 使用索引值来查找并对比新旧节点
function diffChildrenByIndex(oldChildren, newChildren, patches) {
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
        if (typeMap[cur.type] && typeMap[cur.type].length) {
            let old = typeMap[cur.type].shift()
            diff(old, cur, patches)
        } else {
            diff(null, cur, patches)
        }
    }

    // 剩余未被使用的旧节点，将其移除
    Object.keys(typeMap).forEach(type => {
        let arr = typeMap[type]
        arr.forEach(old => {
            diff(old, null, patches)
        })
    })
}

// =====patch过程，更新视图==== //
// 将变化更新到视图上
function doPatch(patches) {
    // 创建节点
    function createDOM(node) {
        let type = node.type
        return isTextNode(type) ?
            document.createTextNode(node.props.nodeValue) :
            document.createElement(type)
    }
    // 将节点插入父节点，如果节点存在父节点中，则调用insertBefore执行的是移动操作而不是复制操作，
    // 因此也可以用来进行MOVE操作
    function insertDOM(newNode) {
        let parent = newNode.$parent.$el
        let children = parent.children

        let el = newNode.$el
        let after = children[newNode.index]

        after ? parent.insertBefore(el, after) : parent.appendChild(el)
    }
    // 设置DOM节点属性
    function setAttributes(vnode, attrs) {
        if (isTextNode(vnode.type)) {
            vnode.$el.nodeValue = vnode.props.nodeValue
        } else {
            let el = vnode.$el
            attrs && Object.keys(attrs).forEach(key => {
                setAttribute(el, key, attrs[key])
            });
        }
    }

    // 特定类型的变化，需要重新生成DOM节点，
    // 由于无法保证patches的顺序，因此此处提前生成
    const beforeCommit = {
        [REPLACE](oldNode, newNode) {
            newNode.$el = createDOM(newNode)
        },
        [UPDATE](oldNode, newNode) {
            // 复用旧的DOM节点，只需要更新必要的属性即可
            newNode.$el = oldNode.$el
        },
        [INSERT](oldNode, newNode) {
            newNode.$el = createDOM(newNode)
        },
    };

    const commit = {
        [REMOVE](oldNode, newNode) {
            oldNode.$parent.$el.removeChild(oldNode.$el)
        },
        [REPLACE](oldNode, newNode) {
            let parent = oldNode.$parent.$el
            let old = oldNode.$el
            let el = newNode.$el

            // 新插入的节点上添加属性
            setAttributes(newNode, newNode.props)
            parent.insertBefore(el, old);
            parent.removeChild(old);
        },
        [UPDATE](oldNode, newNode) {
            // 只需要更更新diff阶段收集到的需要变化的属性
            setAttributes(newNode, newNode.attrs)
            // 将newNode移动到新的位置，问题在于前面的节点移动后，会影响后面节点的顺序
        },
        [INSERT](oldNode, newNode) {
            // 新插入的节点上添加属性
            setAttributes(newNode, newNode.props)
            insertDOM(newNode)
        },
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

    // 需要MOVE的元素按照新的索引值排序，保证排在前面的先进行移动位置的操作
    patches
        .filter(patch => patch.type === MOVE)
        .sort((a, b) => a.index - b.index)
        .forEach(patch => {
            const { oldNode, newNode } = patch
            insertDOM(newNode)
        })
}