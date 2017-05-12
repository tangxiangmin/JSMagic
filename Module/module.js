(function () {
    // 定义一个保存模块的闭包变量
    var modules = {};

    // define和require接口用于修改和使用modules变量
    function define(name, deps, fn) {
        for (var i = 0; i < deps.length; i++) {
            deps[i] = modules[deps[i]];
        }

        modules[name] = fn.apply(fn, deps);
    }

    function require(name) {
        return modules[name];
    }

    window.require = require;
    window.define = define;
})();

