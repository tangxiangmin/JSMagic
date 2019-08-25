// 伪代码，无法直接运行

// 定义节点可能发生的变化
const [REMOVE, REPLACE, INSERT, UPDATE] = [0, 1, 2, 3];

diff(oldRoot, newRoot)
function diff(oldNode, newNode) {
    let patch;
    if (!newNode) {
        // 旧节点及其子节点都将移除
        patch = { type: REMOVE, oldNode };
    } else if (!oldNode) {
        // 当前节点与其子节点都将插入
        patch = { type: INSERT, newNode };
        // 将所有子节点也标记为INSERT，这一步可以进行优化，
        // 即当父节点为INSERT时，所有子节点均自动标记为INSERT，此处为了便于理解，暂不处理
        diffChildren(null, newNode.children);
    } else if (oldNode.type !== newNode.type) {
        // 使用新节点替换旧节点
        patch = { type: REPLACE, oldNode, newNode };
    } else {
        // 如果存在有变化的属性，则使用新节点的属性更新旧节点
        if (diffAttr(oldNode.props, newNode.props)) {
            patch = { type: UPDATE, oldNode, newNode };
        }
        // 继续比较子节点
        diffChildren(oldNode.children, newNode.children);
    }
    // 将更新保存在节点的patches属性上，旧节点的删除需要保存在新旧节点公共父节点上
    let node = newNode || oldNode.parent;
    if (!node.patches) {
        node.patches = [];
    }
    patch && node.patches.push(patch);
}

function diffAttr(oldAttrs, newAttrs) {
    let patch = {};
    // 判断老的属性中和新的属性的关系
    for (let key in oldAttrs) {
        if (oldAttrs[key] !== newAttrs[key]) {
            patch[key] = newAttrs[key]; // 有可能还是undefined
        }
    }
    for (let key in newAttrs) {
        // 老节点没有新节点的属性
        if (!oldAttrs.hasOwnProperty(key)) {
            patch[key] = newAttrs[key];
        }
    }
    return Object.keys(patch).length > 0;
}

function diffChildren(oldChildren, newChildren) {
    let count;
    // 比较旧子树的节点
    if (oldChildren && oldChildren.length) {
        oldChildren.forEach((child, index) => {
            count++;
            diff(child, (newChildren && newChildren[index]) || null);
        });
    }
    // 如果还有未比较的新节点，继续进行diff将其标记为INSERT
    if (newChildren && newChildren.length) {
        for (; count < newChildren; count++) {
            diff(null, newChildren[index]);
        }
    }
}

// 提交更新
function patch(node) {
    if (!node) return;

    doPatch(node);

    node.children.forEach(child => {
        patch(child);
    });
}

function doPatch(node) {
    let patches = node.patches;
    if (!patches || !patches.length) return;

    const handlers = {
        [REMOVE]: function removeChild(parent, oldNode, newNode) {
            parent.$el.removeChild(oldNode.$el);
        },
        [REPLACE]: function replaceChild(parent, oldNode, newNode) {
            let parent = oldNode.parent.$el;
            let target = oldNode.$el;

            newNode.$el = createDOM(node);

            parent.insertBefore(newNode.$el, target);
            parent.removeChild(target);
        },
        [UPDATE]: function updateNode(parent, oldNode, newNode) {
            const props = newNode.props;
            // todo 这里应该只处理需要更新的属性
            Object.keys(props).forEach(key => {
                newNode.$el.setAttribute(key, props[key]);
            });
        },
        [INSERT]: function insertNode(parent, oldNode, newNode) {
            newNode.$el = createDOM(newNode);

            newNode.parent.$el.appendChild(newNode.$el);
        }
    };
    patches.forEach(patch => {
        const {type, oldNode, newNode} = patch
        let handler = handlers[type];
        // 根节点的父节点其$el就是页面挂载容器
        handler && handler(newNode.parent, oldNode, newNode);
    });

    function createDOM(node) {
        return document.createElement(node.type);
    }
}

module.exports = {
    diff,
    patch
};
