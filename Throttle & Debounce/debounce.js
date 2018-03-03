
/**
 * 
 * @param {*} cb处理函数 
 * @param {*} delay 时间间隔，只有两次调用的时间间隔大于delay，才会触发回调处理函数
 */
module.exports = function debounce(cb, delay) {
    var timer = null;
    return function() {
        clearTimeout(timer);
        var args = arguments,
            context = this;

        timer = setTimeout(() => {
            cb.apply(context, args);
        }, delay);
    };
};