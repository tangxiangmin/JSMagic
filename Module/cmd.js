(function (window) {
    // 定义一个保存模块的闭包变量
    var modules = {};

    // define和require接口用于修改和使用modules变量
    function define(name, fn) {
        modules[name] = {
            isExec: false,
            fn: fn,
            result: {} // 初始化exports
        };
    }

    function require(name) {
        var module = modules[name];
        if (!module.isExec) {
            module.fn.apply(null, [require, module.result]);
            module.isExec = true
        }
        return module.result;
    }

    window.define = define;
    window.useModule = function(ids, fn){
        var exports = ids.map(id=>{
            return require(id);
        })
        fn && fn.apply(null, exports);
    }
})(window);

define("bar", function(require, exports) {
    console.log("bar exec");
    exports.hello = function() {
        console.log("hello from bar");
    };
});

define("test", function (require, exports) {
    console.log("test exec");
    exports.hello = function () {
        console.log("hello from test");
    }
})


define("foo", function(require, exports) {
    var bar = require("bar");
    bar.hello();

    var test = require('test');
    test.hello();

    var test = require("test");

});

useModule(["foo"])
