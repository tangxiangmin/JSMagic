// testPromise()

testAwait();
// 测试promise
function testPromise() {
    case2();
    // 1、2、3、4

    function case1() {
        // 如果promise1是rejected态的，但是onRejected返回了一个值（包括undifined），那么promise2还是fulfilled态的，这个过程相当于catch到异常，并将它处理掉，所以不需要向上抛出。
        var p1 = new Promise((resolve, reject) => {
            throw "p1 error";
        });

        p1.then(
            res => {
                return 1;
            },
            e => {
                console.log(e);
                return 2;
            }
        ).then(a => {
            // 如果注册了onReject，则不会影响后面Promise执行
            console.log(a); // 收到的是2
        });
    }
    function case2() {
        //  在promise1的onRejected中处理了p1的异常，但是又抛出了一个新异常，，那么promise2的onRejected会这个异常
        var p1 = new Promise((resolve, reject) => {
            throw "p1 error";
        });
        p1.then(
            res => {
                return 1;
            },
            e => {
                console.log(e);
                throw "error in p1 onReject";
            }
        ).then(
            a => {},
            e => {
                // 如果p1的 onReject 抛出了异常
                console.log(e);
            }
        );
    }

    function case3() {
        // 如果promise1是rejected态的，并且没有定义onRejected，则promise2也会是rejected态的。
        var p1 = new Promise((resolve, reject) => {
            throw "p1 error";
        });

        p1.then(res => {
            return 1;
        }).then(
            a => {
                console.log("not run:", a);
            },
            e => {
                // 如果p1的 onReject 抛出了异常
                console.log("handle p2:", e);
            }
        );
    }
    function case4() {
        // // 如果promise1是fulfilled态但是onFulfilled和onRejected出现了异常，promise2也会是rejected态的，并且会获得promise1的被拒绝原因或异常。
        var p1 = new Promise((resolve, reject) => {
            resolve(1);
        });
        p1.then(res => {
            console.log(res);
            throw "p1 onFull error";
        }).then(
            () => {},
            e => {
                console.log("handle p2:", e);
                return 123;
            }
        );
    }
}

// 测试async await
function testAwait() {
    // case1()
    // case2();
    case3()

    function sleep(cb, cb2 =()=>{},ms = 100) {
        cb2()
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    cb();
                    resolve();
                }catch(e){
                    reject(e)
                }
            }, ms);
        });
    }
    // 通过promise.catch来捕获
    async function case1() {
        await sleep(() => {
            throw "sleep reject error";
        }).catch(e => {
            console.log(e);
        });
    }
    // 通过try...catch捕获
    async function case2() {
        try {
            await sleep(() => {
                throw "sleep reject error";
            })
        } catch (e) {
            console.log("catch:", e);
        }
    }
    // 如果是未被reject抛出的错误，则无法被捕获
    async function case3() {
        try {
            await sleep(()=>{}, () => {
                // 抛出一个未被promise reject的错误
                throw 'no reject error'
            }).catch((e)=>{
                console.log('cannot catch:', e)
            })
        } catch (e) {
            console.log("catch:", e);
        }
    }
}
