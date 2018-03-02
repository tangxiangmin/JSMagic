中间件原理实现
===

其思路就是维护一个回调函数的队列，在注册中间件时将中间件添加到该队列上，然后依次执行

## 中间件
中间件是一个回调函数，包含`req`、`res`、`next`三个参数，其中next即队列上的下一个中间件，
需要在中间件处理逻辑中手动调用下一个中间件，或者表示中止操作
```
let mid1 = function(req, res, next) {
    console.log("this is mid 1 before next");
    next();
    console.log("this is mid 1 after next");
};
```
通过函数执行栈，可以在next前和后分别处理一些逻辑

## 注册中间件
注册原理很简单，通过闭包维护一个数组，然后push到队列即可
```
let stack = [];

use(middleware){
    stack.push(middleware);
}
```

## 依次调用
通过一个游标，依次调用中间件
```
handle(req, res) {
    var index = 0;

    function next() {
        var handler = stack[index++];
        if (handler) {
            // 这里就是为什么需要手动调用next()的原理
            handler(req, res, next);
        }
    }

    next();
}
```
