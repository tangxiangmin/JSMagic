let appRoot
class Component {
    constructor(props) {
    }

    // 这种方式只能从当前组件的节点开始进行diff，但真实情况是我们应该从根节点开始进行diff
    badSetState(newState) {
        this.state = Object.assign(this.state, newState)
        let vnode = this.$vnode
        let old = vnode.$child
        let cur = this.render()

        diff(old, cur, (patches) => {
            doPatch(patches)
        })
    }
    setState(newState, cb) {
        this.nextState = Object.assign({}, this.state, newState) // 保存需要更新的

        // 从根节点开始进行diff，当遇见Component时，需要使用新的props和props更新节点
        diff(appRoot, appRoot, (patches) => {
            doPatch(patches)
            cb && cb()
        })
    }
}

// 将根组件节点渲染到页面上
function renderDOM(root, dom, cb) {
    // root.$el =dom
    root.$parent = {
        $el: dom
    }
    if (!appRoot) {
        appRoot = root // 保存整个应用根节点的引用
    }
    // 初始化时直接使用同步diff
    let patches = diffSync(null, root)
    doPatch(patches)
    cb && cb()
}