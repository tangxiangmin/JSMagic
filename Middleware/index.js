let app = (function() {
    let stack = [];

    return {
        // 模拟响应对象
        initResponse() {
            return {
                send(msg) {
                    console.log("server send: " + msg);
                }
            };
        }, // 模拟请求对象
        initRequest(url) {
            return {
                url
                // 一些其他的属性和方法
            };
        },
        // 模拟get方法
        get(url, cb) {
            let req = this.initRequest(url),
                res = this.initResponse();

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

let mid1 = function(req, res, next) {
    console.log("this is mid 1 before next");
    next();
    console.log("this is mid 1 after next");
};
let mid2 = function(req, res, next) {
    console.log("this is mid 2 before next");
    next();
    console.log("this is mid 2 after next");
};

app.use(mid1);
app.use(mid2);

app.get("/index", function(req, res, next) {
    res.send("IndexController action");
    next();
});

app.use(function(req, res, next) {
    console.log("this is mid 3 before next");
    next(); // 实际上暂没有注册下一个中间件
    console.log("this is mid 3 after next");
});
