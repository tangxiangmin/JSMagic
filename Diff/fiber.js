// 伪代码，无法直接运行

let workInProgress, currentWorkRoot;
function scheduleWork(fiberRoot) {
    workInProgress = fiberRoot;
    currentWorkRoot = fiberRoot;

    // 浏览器在空闲期间会持续调用workLoop，从workInProgress开始继续diff
    requestHostCallback(workLoop);
}

function workLoop() {
    while (workInProgress) {
        // 判断当前帧是否完成，每完成一个节点的diff，就将控制权交给浏览器，检测
        if (shouldYield()) {
            // 当前时间切片已用光，但diff流程未结束，浏览器会在合适的实际继续调用workInProgress
            return true;
        } else {
            // 可以继续进行下一个节点的diff
            workInProgress = performUnitWork(workInProgress);
        }
    }
}

function performUnitWork(fiber) {
    let newChildren = getFiberNewChildren(fiber); // 获得更新后的newChildren
    diff(fiber, newChildren, oldChildren); // 如果存在子节点，则更新workInProgress

    // 返回workLoop，继续遍历
    if (fiber.child) {
        return fiber.child;
    }
    while (fiber) {
        // 然后遍历兄弟节点，完成兄弟节点的diff操作
        if (fiber.sibling) {
            return fiber.sibling;
        }
        // 回到父节点
        fiber = fiber.return;
        if (currentWorkRoot === fiber) {
            return null;
        }
    }
}
// 找到旧节点
function getFiberChildren(fiber) {
    let child = fiber.child;
    let children = [];
    while (child) {
        children.push(child);
        child = child.sibling;
    }
    return children;
}
function diff(parentFiber, newChildren) {
    let prevFiber = null;
    let oldChildren = getFiberChildren(fiber); // 获取旧的子节点列表
    let i;
    // 新节点与旧节点对比
    for (i = 0; i < newChildren.length; ++i) {
        let newNode = newChildren[i];
        let oldFiber = oldChildren[i];
        let newFiber;
        // 此处与前面递归实现的比较逻辑基本相同
        if (oldFiber) {
            // 类型相同，表示节点实例可复用
            if (isSameVnode(newNode, oldFiber)) {
                if (diffAttr(newNode, oldFiber)) {
                    // 属性不同，标记为更新
                    newFiber = createFiber(newNode, UPDATE);
                    newFiber.alternate = oldFiber;
                } else {
                    // 属性相同，可以完全复用
                    newFiber = oldFiber;
                }
            } else {
                // 类型不同，标记为替换
                newFiber = createFiber(newNode, REPLACE);
            }
            newFiber.alternate = oldFiber;
        } else {
            // 当前位置不存在旧节点，表示新增
            newFiber = createFiber(newNode, INSERT);
        }

        // 调整fiber之间的引用，构建新的fiber树
        newFiber.return = parentFiber;
        if (prevFiber) {
            prevFiber.sibling = newFiber;
        } else {
            // 更新父元素的子节点
            parentFiber.child = newFiber;
        }
        prevFiber = newFiber;
    }

    // 移除剩余未被比较的旧节点
    for (; i < oldChildren.length; ++i) {
        let oldFiber = oldChildren[i];
        oldFiber.patchTag = REMOVE;
        enqueueUpdate(parentFiber, oldFiber); // 由于被删除的节点不存在fiber树中，因此交给父节点托管
    }
}
