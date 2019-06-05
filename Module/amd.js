(function(window) {
    // 定义一个保存模块的闭包变量
    var modules = {};

    // define和require接口用于修改和使用modules变量
    function define(name, deps, fn) {
        for (var i = 0; i < deps.length; i++) {
            var module = modules[deps[i]];
            deps[i] = module;
        }
        modules[name] = fn.apply(fn, deps);
    }

    function require(name, fn) {
        fn.call(fn, modules[name]);
    }

    window.require = require;
    window.define = define;
})(window);


// 测试代码
define("bar", [], function () {
    console.log('bar exec')

    return {
        hello() {
            console.log("hello from bar");
        }
    };
});
define("test", [], function() {
    console.log("test exec");
    return {
        hello() {
            console.log("hello from test");
        }
    };
});

define("foo", ["bar", "test"], function (bar, test) {
    bar.hello()
    test.hello()

    return {};
});


require("foo", function (foo) {
});
