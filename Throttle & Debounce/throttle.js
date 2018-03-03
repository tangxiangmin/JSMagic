

module.exports = function throttle(cb, duration) {
    var start = new Date();
    return function() {
        var context = this,
            args = arguments,
            now = new Date();

        if (now - start >= duration) {
            cb.apply(context, args);
            start = now;
        }
    };
};