
// vnode实际上就是一个用于描述UI的对象，包含一些基本属性
const TEXT_NODE = Symbol('__text_node')

function isTextNode(type) {
    return type === TEXT_NODE
}
function createVNode(type, props = {}, children = []) {
    let key = props.key
    delete props.key

    let vnode = {
        type,
        props,
        key,
        $el: null,
    }

    vnode.children = children.map((child, index) => {
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

        child.index = index
        child.$parent = vnode // 保存对父节点的引用
        return child
    })

    return vnode
}

// 将一个vnode渲染为真实的DOM节点，最直观的方法是使用递归
// 由于需要将子DOM节点插入需要提前生成父DOM节点，因此此处使用先序遍历
function VNode2DOM(root, parentDOM) {
    let { type, props, children } = root

    // 将当前vnode渲染为对应的DOM节点
    let dom
    if (isTextNode(type)) {
        dom = document.createTextNode(root.props.nodeValue)
    } else {
        dom = document.createElement(type)
        for (var key in props) {
            setAttribute(dom, key, props[key])
        }
    }

    Array.isArray(children) && children.forEach(child => {
        VNode2DOM(child, dom)
    })

    // 将当前节点插入节点
    if (parentDOM) {
        parentDOM.appendChild(dom)
    }
    root.$el = dom

    return dom
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

// 在ssr中，我们需要的不是DOM节点，而是HTML字符串，
// 由于构建一个vnode的html片段需要知道其全部子节点的html片段，因此此处使用后序遍历
function VNode2HTML(root) {
    let { type, props, children } = root

    let sub = '' // 获取子节点渲染的html片段
    Array.isArray(children) && children.forEach(child => {
        sub += VNode2HTML(child)
    })

    let el = '' // 当前节点渲染的html片段
    if (isTextNode(type)) {
        el += props.nodeValue // 纯文本节点则直接返回
    } else {
        let attrs = ''
        for (var key in props) {
            attrs += getAttr(key, props[key])
        }
        el += `<${type}${attrs}>${sub}</${type}>` // 将子节点插入当前节点
    }

    return el
    function getAttr(prop, val) {
        // 渲染HTML，我们不需要 事件 等props
        // 事实上如果需要，我们也可以通过`onclick="window.xxxHandler"`来实现事件注册
        let isEvent = prop.indexOf('on') === 0
        return isEvent ? '' : ` ${prop}="${val}"`
    }
}
