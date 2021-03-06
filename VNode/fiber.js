// 我们可以将fiber也当做特殊形式的vnode
// 除此之外，fiber包含了一些特殊的属性，用于将描述整个UI的vnode树结构转换为链表结构，然后就可以

const TEXT_NODE = Symbol('__text_node')
function isTextNode(type) {
    return type === TEXT_NODE
}

function createFiber(type, props, children) {
    let key = props.key
    delete props.key

    let vnode = {
        type,
        props,
        key,
        $el: null,
        index: 0
    }

    children = children.map((child, index) => {
        if (!child.type) {
            // 处理文本节点
            child = {
                type: TEXT_NODE,
                props: {
                    nodeValue: child
                },
                children: []
            }
        }
        return child
    })

    vnode.children = bindFiber(vnode, children)
    return vnode
}

function bindFiber(parent, children) {
    let firstChild
    return children.map((child, index) => {
        child.$parent = parent // 每个子节点保存对父节点的引用
        child.index = index

        if (!firstChild) {
            parent.$child = child // 父节点保存对于第一个子节点的引用
        } else {
            firstChild.$sibling = child // 保存对于下一个兄弟节点的引用
        }
        firstChild = child
        return child
    })
}