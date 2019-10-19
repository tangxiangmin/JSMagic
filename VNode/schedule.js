/**
 * 具体思路，在当前帧结束后暂停任务交给主线程，然后再下一帧的空闲时间继续未完成的任务
 */

// 默认1秒30帧运行，即一个切片最多运行的时间
const frameLength = 1000 / 30

let frameDeadline // 当前切片执行时间deadline，在每次执行新的切片时会更新为getCurrentTime() + frameLength
let scheduledCallback

function getCurrentTime() {
    return +new Date()
}
// 对外暴露的接口
function shouldYield() {
    return getCurrentTime() > frameDeadline
}

// 注册diff任务
function scheduleWork(workLoop) {
    scheduledCallback = workLoop
    // 注册异步任务，我们可以采用下面这两种策略来进行进行调度

    //requestAnimationFrame(onAnimationFrame)
    requestIdleCallback(onIdleFrame)
}

// 取消之前注册的diff任务
function cancleWork() {
    scheduledCallback = null
}

// 通过requestAnimationFrame注册，这样可以在每一帧开始之前执行注册的回调任务
function onAnimationFrame() {
    if (!scheduledCallback) return;
    // 更新当前diff流程的deadline，保证任务最多执行frameLength的时间
    frameDeadline = getCurrentTime() + frameLength;

    // 在每一帧中执行注册的任务workLoop
    // 在workLoop的每次循环中都会调用shouldYield，如果当前时间超过frameDeadline时，就会暂停循环并返回true
    const hasMoreWork = scheduledCallback();
    // 根据workLoop返回值判断当前diff是否已经执行完毕
    if (hasMoreWork) {
        // 注册回调，方便下一帧更新frameDeadline，继续执行diff任务，直至整个任务执行完毕
        // 由于workLoop通过闭包维持了对于cursor当前遍历的节点的引用，因此下次diff可以直接从上一次的暂停点继续执行

        // 由于标签页在后台时会暂停`requestAnimationFrame`，这也会导致整个diff过程暂停，可以使用定时器来处理这个问题
        // 如果过了在某段时间内没有执行requestAnimationFrame，则会通过定时器继续注册回调
        let rAFTimeoutID = setTimeout(() => {
            onAnimationFrame()
        }, frameLength * 2);

        requestAnimationFrame(nextRAFTime => {
            clearTimeout(rAFTimeoutID) // 当requestAnimationFrame继续执行时，移除
            onAnimationFrame();
        });
    } else {
        // 如果已经执行完毕，则清空
        scheduledCallback = null;
    }
}

// 通过requestIdleCallback注册，在浏览器的空闲时间时执行低优先级工作，这样不会影响延迟关键事件，
// 通过timeout参数可以控制每次占用的调用的时长
function onIdleFrame(deadline) {
    if (!scheduledCallback) return;
    let remain = deadline.timeRemaining()// 当前帧剩余可用的空闲时间
    frameDeadline = getCurrentTime() + Math.min(remain, frameLength) // 限制当前任务切片的执行deadline

    const hasMoreWork = scheduledCallback();
    if (hasMoreWork) {
        requestIdleCallback(onIdleFrame, { timeout: frameLength })
    } else {
        // 如果已经执行完毕，则清空
        scheduledCallback = null
    }
}
