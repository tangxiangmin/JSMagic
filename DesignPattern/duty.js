const { time } = require("console");

function test1() {
    class Rule1 extends Hanlder {
        handle() {
            let canHandle = true;
            if (canHandle) {
                return "result1";
            } else if (this.next) {
                return this.next.handle();
            }
        }
    }

    class Rule2 extends Hanlder {
        handle() {
            let canHandle = true;
            if (canHandle) {
                return "result2";
            } else if (this.next) {
                return this.next.handle();
            }
        }
    }

    let rule1 = new Rule1();
    let rule2 = new Rule2();

    rule1.setNext(rule2);

    rule1.handle();
}

function test2() {
    function formateTime(timestamp) {
        let minute = 1000 * 60;
        let hour = minute * 60;
        let day = hour * 24;
        let month = day * 30;

        let diffValue = +new Date() - timestamp;
        let monthC = diffValue / month;
        let weekC = diffValue / (7 * day);
        let dayC = diffValue / day;
        let hourC = diffValue / hour;
        let minC = diffValue / minute;
        if (monthC >= 1) {
            result = parseInt(monthC) + "个月前";
        } else if (weekC >= 1) {
            result = parseInt(weekC) + "周前";
        } else if (dayC >= 1) {
            result = parseInt(dayC) + "天前";
        } else if (hourC >= 1) {
            result = parseInt(hourC) + "个小时前";
        } else if (minC >= 1) {
            result = parseInt(minC) + "分钟前";
        } else {
            result = "刚刚";
        }
        return result;
    }

    let res = formateTime(+new Date("2020-12-20 12:00:00"));
    console.log(res);
}

function test3() {
    function getLevel(score) {
        if (score < 10) {
            // ... 1级会员
        } else if (score < 100) {
            // ... 2级会员
        } else if (score < 1000) {
            // ... 3级会员
        }
        // ...
    }

    const rule1 = {
        handle(score) {
            if (score < 10) {
                // ... 1级会员
            } else if (this.next) {
                return this.next.handle(score);
            }
        },
        setNext(rule) {
            this.next = rule;
        },
    };

    const rule2 = {
        handle(score) {
            if (score < 100) {
                // ... 2级会员
            } else if (this.next) {
                return this.next.handle(score);
            }
        },
        setNext(rule) {
            this.next = rule;
        },
    };

    const rule3 = {
        handle(score) {
            if (score < 1000) {
                // ... 3级会员
            } else if (this.next) {
                return this.next.handle(score);
            }
        },
        setNext(rule) {
            this.next = rule;
        },
    };

    rule1.setNext(rule2);
    rule2.setNext(rule3);

    let ans = rule1.handle(100);
    console.log(ans);
}
test3();
function test4() {
    function createRule(handler) {
        return {
            next: null,
            handle(args) {
                let ans = handler(args);
                if (ans) {
                    return ans;
                } else if (this.next) {
                    this.next.handle(args);
                }
            },
            setNext(rule) {
                this.next = rule;
            },
        };
    }
    const rule1 = createRule((score) => {
        if (score >= 10) return;
        // ... 会员1
        return true;
    });
    const rule2 = createRule((score) => {
        if (score >= 100) return;
        // ... 会员2
        return true;
    });
    const rule3 = createRule((score) => {
        if (score >= 1000) return;
        // ... 会员3
        return true;
    });

    rule1.setNext(rule2);
    rule2.setNext(rule3);
    
    rule1.handle(80)
}
