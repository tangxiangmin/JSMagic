function test1() {
    // 通过闭包维护state的存在
    // 注意这里的state是一个函数而不是一个变量
    function useState(initVal) {
        let val = initVal;

        const state = () => {
            return val;
        };
        const setState = (newVal) => {
            val = newVal;
        };
        return [state, setState];
    }

    function Counter() {
        const [count, setCount] = useState(1);

        return {
            click() {
                setCount(count() + 1);
            },
            render() {
                console.log(`count is ${count()}`);
            },
        };
    }

    const App = Counter();

    App.render();
    App.click();
    App.render();
}

// 版本1存在的问题是，state是一个函数而不是变量，这不符合预期的使用习惯，但是直接返回变量又会存在引用丢失的问题
// vue的解决方法是使用ref(xxx)将字面量包裹成引用类型
// 为了避免组件依赖的state丢失，我们可以通过变量提升，将state放置在组件的render外面，这样每次render就能获得同一个state了
function test2() {
    const SimpleReact = (() => {
        let state; // 为了简化逻辑，我们只维护了一个组件的单个state
        return {
            render(Component) {
                // 追踪Component的状态
                const instance = Component();
                instance.render();
                return instance;
            },
            useState(initVal) {
                state = state || initVal; // 首次初始化赋值，后续不再更新
                const setState = (newVal) => {
                    state = newVal;
                };
                return [state, setState];
            },
        };
    })();
    const { render, useState } = SimpleReact;

    function Counter() {
        const [count, setCount] = useState(1);

        return {
            click() {
                setCount(count + 1);
            },
            render() {
                console.log(`count is ${count}`);
            },
        };
    }

    let App;
    App = render(Counter);

    App.click();

    App = render(Counter);
}

// 现在来解决一个组件中使用多个state
function test3() {
    const SimpleReact = (() => {
        let hooks = [];
        let currentHook = 0;
        return {
            render(Component) {
                // 追踪Component的状态
                const instance = Component();
                instance.render();
                currentHook = 0; // render之后重置索引
                return instance;
            },
            useState(initVal) {
                let cur = currentHook;
                hooks[cur] = hooks[cur] || initVal;
                const setState = (newVal) => {
                    hooks[cur] = newVal;
                };

                currentHook++;
                return [hooks[cur], setState];
            },
        };
    })();

    const { render, useState } = SimpleReact;

    function Counter() {
        const [count, setCount] = useState(1);
        const [count2, setCount2] = useState(100);

        return {
            click() {
                setCount(count + 1);
            },
            click2() {
                setCount2(count2 + 10);
            },
            render() {
                console.log(`count is ${count}`);
                console.log(`count2 is ${count2}`);
            },
        };
    }

    let App;
    App = render(Counter);

    App.click();

    App = render(Counter);

    App.click2();
    App = render(Counter);
}

// 先实现一个useEffect
function test4() {
    const SimpleReact = (() => {
        let state;
        let lastState;
        return {
            render(Component) {
                // 追踪Component的状态
                const instance = Component();
                instance.render();
                return instance;
            },
            useState(initVal) {
                state = state || initVal;
                const setState = (newVal) => {
                    state = newVal;
                };
                return [state, setState];
            },
            // 监听单个state的变化
            useEffect(callback, val) {
                const hasChanged = !val || val !== lastState;
                if (hasChanged) {
                    callback();
                    lastState = val;
                }
            },
        };
    })();

    const { render, useState, useEffect } = SimpleReact;

    function Counter() {
        const [count, setCount] = useState(1);

        useEffect(() => {
            console.log(`effect count is ${count}`);
        });

        useEffect(() => {
            console.log("effect run", count);
        }, count);

        return {
            click() {
                setCount(count + 1);
            },
            noop() {
                setCount(count); // 不会触发effect
            },
            render() {
                console.log(`count is ${count}`);
            },
        };
    }

    let App;
    App = render(Counter);

    App.click();

    App = render(Counter);

    App.noop();
    App = render(Counter);
}

// 实现多个state
function test5() {
    const SimpleReact = (() => {
        let states = [];
        let effects = [];

        let currentState = 0;
        let currentEffect = 0;

        return {
            render(Component) {
                // 追踪Component的状态
                const instance = Component();
                instance.render();

                // 函数组件render之后重置索引
                currentState = 0;
                currentEffect = 0;
                return instance;
            },
            useState(initVal) {
                let cur = currentState;
                states[cur] = states[cur] || initVal;
                const setState = (newVal) => {
                    states[cur] = newVal;
                };

                currentState++;
                return [states[cur], setState];
            },
            // 监听单个state的变化
            useEffect(callback, arr) {
                let cur = currentEffect;

                // 参数列表中只要有某一个值发生变化，就会执行callback
                const hasChanged =
                    !effects[cur] ||
                    !effects[cur].every((val, index) => arr[index] === val);

                if (hasChanged) {
                    callback();
                }

                currentEffect++;
                effects[cur] = arr;
            },
        };
    })();

    const { render, useState, useEffect } = SimpleReact;

    function useRef(initVal) {
        const [val, setVal] = useState({ current: initVal });

        return setVal;
    }

    function Counter() {
        const [count, setCount] = useState(1);
        const [count2, setCount2] = useState(100);

        useEffect(() => {
            console.log("count effect", count);
        }, [count]);

        useEffect(() => {
            console.log("count2 effect", count2);
        }, [count2]);

        useEffect(() => {
            console.log("all effect", { count, count2 });
        }, [count, count2]);

        return {
            click() {
                setCount(count + 1);
            },
            click2() {
                setCount2(count2 + 10);
            },
            render() {
                // console.log(`count is ${count}`);
            },
        };
    }

    let App;
    App = render(Counter);

    App.click();

    App = render(Counter);

    App.click2();

    App = render(Counter);
}

// 实现useRef
function test6() {
    // 仅仅是返回一个对象字面量而已，在其他函数中通过闭包就可以访问
    function useRef(initVal) {
        return { current: initVal };
    }
}

// test1()
// test2()
// test3()
// test4();
// test5();
test6();
