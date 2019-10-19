
// =====patch过程，更新视图==== //
function doPatch(patches) {
    // 特定类型的变化，需要重新生成DOM节点，由于无法完全保证patches的顺序，因此在此步骤生成vnode.$el
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
    // 执行此步骤时所有vnode.$el都已准备就绪
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

// 创建节点
function createDOM(node) {
    let type = node.type
    return isTextNode(type) ?
        document.createTextNode(node.props.nodeValue) :
        document.createElement(type)
}
// 将节点插入父节点，如果节点存在父节点中，则调用insertBefore执行的是移动操作而不是复制操作，因此也可以用来进行MOVE操作
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