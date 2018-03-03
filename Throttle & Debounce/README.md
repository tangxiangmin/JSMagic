## 去抖函数
> 函数调用n秒后才会执行，如果函数在n秒内被调用的话则函数不执行，重新计算执行时间

基本思路是采用定时器来实现，在指定时间内连续触发，则清除上一次的定时器，并重新生成新的定时器
```js
function debounce(cb, delay) {
    var timer = null
    return function () {
        clearTimeout(timer)
        var args = arguments,
            context = this

        timer = setTimeout(() => {
            cb.apply(context, args)
        }, delay);
    }
}
```
去抖函数的问题在于：它是在我们事件结束后的一段时间内才会执行，会有一个延迟性。如果函数触发的频率过快，则原本的回调函数一次都不会执行，因为生成的定时器被频繁的清除。不过这也是去抖函数本身的目的，即**重新计算执行时间**


## 节流函数
> 函数预先设定一个执行周期，当调用动作的时刻大于等于执行周期则执行该动作，然后进入下一个新周期

基本思路是通过比较时间戳来实现
```js
function throttle(cb, duration) {
    var start = new Date()
    return function () {
        var context = this,
            args = arguments,
            now = new Date()

        if (now - start >= duration) {
            cb.apply(context, args);
            start = now;
        }
    }
}
```

## 注意
节流函数和去抖函数本身没有减少事件的触发次数，而是控制事件处理函数的执行来减少实际逻辑处理过程，提高浏览器性能。