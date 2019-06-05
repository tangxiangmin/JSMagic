let app = (function() {
    let stack = [];
    return {
        // 模拟get方法
        get(url, cb) {
            let req = {};
            let res = {};

            app.use(cb);

            // 保证所有注册的中间件都可以被调用
            setImmediate(() => {
                this.handle(req, res);
            });
        },

        // 注册中间件
        use(middleware) {
            stack.push(middleware);
        },
        handle(req, res) {
            var index = 0;

            function next() {
                var handler = stack[index++];
                if (handler) {
                    handler(req, res, next);
                }
            }

            next();
        }
    };
})();

app.use(function mid1(req, res, next) {
    console.log("this is mid 1 before next");
    next();
    console.log("this is mid 1 after next");
});
app.use(async function mid2(req, res, next) {
    console.log('sleep for 500ms')
    await sleep(500);
    console.log("this is async mid 2 before next");
    
    next();

    console.log("this is mid 2 after next");
});

app.get("/test", function(req, res, next) {
    console.log('/test action')
    next();
});

app.use(function mid3(req, res, next) {
    console.log("this is mid 3 before next");
    next(); // 实际上暂没有注册下一个中间件
    console.log("this is mid 3 after next");
});


function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}