// 循环diff与递归diff最大的区别在于：循环diff的过程可以在某些时刻中断，并在空闲的时候决定继续或者从头调用节点

const [REMOVE, REPLACE, INSERT, UPDATE, MOVE] = [0, 1, 2, 3, 4];


function sleepSync(time) {
    let now = + new Date()
    while (now + time > +new Date()) { }
}

// 之前同步循环执行diff流程的方法副本
function diffSync(oldFiber, newFiber) {
    newFiber.oldFiber = oldFiber
    let cursor = newFiber // 当前正在进行diff操作的节点
    let patches = []
    while (cursor) {
        // sleepSync(33.33)
        cursor = performUnitWork(cursor, patches)
    }
    return patches
}

let currentRoot // 保存当前diff过程新的根节点，判断是否需要重置diff流程

// 现在diff过程变成了异步的流程，因此只能在回调函数中等待
function diff(oldFiber, newFiber, cb) {
    // 表示前一个diff任务尚未结束，但又调用了新的diff与原来的oldFiber进行对比
    if (currentRoot && currentRoot !== newFiber) {
        cancleWork()
    }
    currentRoot = newFiber // 记录

    newFiber.oldFiber = oldFiber
    // 当前正在进行diff操作的节点，workLoop通过闭包维持了对该节点的引用，因此下次diff可以直接从上一次的暂停点继续执行
    let cursor = newFiber
    let patches = []
    // workLoop可以理解每个切片需要执行的diff任务
    const workLoop = () => {
        while (cursor) {
            // shouldYield在每diff完一个节点之后都会调用该方法，用于判断是否需要暂时中断diff过程
            if (shouldYield()) {
                // workLoop返回true表示当前diff流程还未执行完毕
                return true
            } else {
                // sleepSync(33.33) //just for test, to be remove
                cursor = performUnitWork(cursor, patches)
            }
        }
        // diff流程执行完毕，我们可以使用收集到的patches了
        cb(patches)
        currentRoot = null // 重置
        return false
    }
    // 将diff流程进行切片，现在只能异步等待patches收集完毕了
    scheduleWork(workLoop)
}


function performUnitWork(fiber, patches) {
    let oldFiber = fiber.oldFiber

    // 任务一：对比当前新旧节点，收集变化
    diffFiber(oldFiber, fiber, patches)
    // 任务二：为新节点中children的每个元素找到需要对比的旧节点，设置oldFiber属性，方便下个循环继续执行performUnitWork
    diffChildren(oldFiber && oldFiber.children || [], fiber.children, patches)

    // 将游标移动至新vnode树中的下一个节点，以
    // (div, {}, [
    //     (h1, {}, [text]), 
    //     (ul, {}, [
    //         li1, li2,li3
    //     ])]
    // ]) 为例，整个应用的的遍历流程是 
    // div -> h1 ->  h1(text) -> h1 -> ul ->li1 -> li2 -> li3 -> ul -> div

    // 上面的diffFiber就是遍历当前节点

    // 有子节点继续遍历子节点
    if (fiber.$child) return fiber.$child

    while (fiber) {
        // 无子节点但是有兄弟节点，继续遍历兄弟节点
        if (fiber.$sibling) return fiber.$sibling
        // 子节点和兄弟节点都遍历完毕，返回父节点，开始遍历父节点的兄弟节点，重复该过程
        fiber = fiber.$parent;
        if (!fiber) return null
    }

    return null
}

function diffFiber(oldNode, newNode, patches) {
    if (!oldNode) {
        // 当前节点与其子节点都将插入
        patches.push({ type: INSERT, newNode })
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
    }
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

// 根据type和key来进行判断，避免同类型元素顺序变化导致的不必要更新
function diffChildren(oldChildren, newChildren, patches) {
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
            delete keyMap[key]
            vnode.oldFiber = child
        } else {
            // 将剩余的节点保存起来，与剩余的新节点进行比较
            if (!typeMap[type]) typeMap[type] = []
            typeMap[type].push(child)
        }
    })

    // 此时key相同的节点已被比较
    for (let i = 0; i < newChildren.length; ++i) {
        let cur = newChildren[i]
        if (!cur) continue; // 已在在前面与此时key相同的节点进行比较
        if (typeMap[cur.type] && typeMap[cur.type].length) {
            let old = typeMap[cur.type].shift()
            cur.oldFiber = old
        } else {
            cur.oldFiber = null
        }
    }

    // 剩余未被使用的旧节点，将其移除
    Object.keys(typeMap).forEach(type => {
        let arr = typeMap[type]
        arr.forEach(old => {
            patches.push({ type: REMOVE, oldNode: old, })
        })
    })
}


// let workInProgress, currentWorkRoot;
// function scheduleWork(fiberRoot) {
//     workInProgress = fiberRoot;
//     currentWorkRoot = fiberRoot;

//     // 浏览器在空闲期间会持续调用workLoop，从workInProgress开始继续diff
//     requestHostCallback(workLoop);
// }

// function workLoop() {
//     while (workInProgress) {
//         // 判断当前帧是否完成，每完成一个节点的diff，就将控制权交给浏览器，检测
//         if (shouldYield()) {
//             // 当前时间切片已用光，但diff流程未结束，浏览器会在合适的实际继续调用workInProgress
//             return true;
//         } else {
//             // 可以继续进行下一个节点的diff
//             workInProgress = performUnitWork(workInProgress);
//         }
//     }
// }

// function performUnitWork(fiber) {
//     let newChildren = getFiberNewChildren(fiber); // 获得更新后的newChildren
//     diff(fiber, newChildren, oldChildren); // 如果存在子节点，则更新workInProgress

//     // 返回workLoop，继续遍历
//     if (fiber.child) {
//         return fiber.child;
//     }
//     while (fiber) {
//         // 然后遍历兄弟节点，完成兄弟节点的diff操作
//         if (fiber.sibling) {
//             return fiber.sibling;
//         }
//         // 回到父节点
//         fiber = fiber.return;
//         if (currentWorkRoot === fiber) {
//             return null;
//         }
//     }
// }
// // 找到旧节点
// function getFiberChildren(fiber) {
//     let child = fiber.child;
//     let children = [];
//     while (child) {
//         children.push(child);
//         child = child.sibling;
//     }
//     return children;
// }
// function diff(parentFiber, newChildren) {
//     let prevFiber = null;
//     let oldChildren = getFiberChildren(fiber); // 获取旧的子节点列表
//     let i;
//     // 新节点与旧节点对比
//     for (i = 0; i < newChildren.length; ++i) {
//         let newNode = newChildren[i];
//         let oldFiber = oldChildren[i];
//         let newFiber;
//         // 此处与前面递归实现的比较逻辑基本相同
//         if (oldFiber) {
//             // 类型相同，表示节点实例可复用
//             if (isSameVnode(newNode, oldFiber)) {
//                 if (diffAttr(newNode, oldFiber)) {
//                     // 属性不同，标记为更新
//                     newFiber = createFiber(newNode, UPDATE);
//                     newFiber.alternate = oldFiber;
//                 } else {
//                     // 属性相同，可以完全复用
//                     newFiber = oldFiber;
//                 }
//             } else {
//                 // 类型不同，标记为替换
//                 newFiber = createFiber(newNode, REPLACE);
//             }
//             newFiber.alternate = oldFiber;
//         } else {
//             // 当前位置不存在旧节点，表示新增
//             newFiber = createFiber(newNode, INSERT);
//         }

//         // 调整fiber之间的引用，构建新的fiber树
//         newFiber.return = parentFiber;
//         if (prevFiber) {
//             prevFiber.sibling = newFiber;
//         } else {
//             // 更新父元素的子节点
//             parentFiber.child = newFiber;
//         }
//         prevFiber = newFiber;
//     }

//     // 移除剩余未被比较的旧节点
//     for (; i < oldChildren.length; ++i) {
//         let oldFiber = oldChildren[i];
//         oldFiber.patchTag = REMOVE;
//         enqueueUpdate(parentFiber, oldFiber); // 由于被删除的节点不存在fiber树中，因此交给父节点托管
//     }
// }
