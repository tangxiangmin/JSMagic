class Dep {
    constructor() {
        this.subs = {};
    }
    subscibe(name, cb) {
        if (typeof this.subs[name] !== "undefined") {
            throw new Error("已存在相同的订阅者，换个名字~");
        }
        this.subs[name] = cb;
    }
    notify(data) {
        var subs = this.subs;
        Object.keys(subs).forEach((key) => {
            subs[key](data);
        })
    }
}


class V {
    constructor(params) {
        this.el = document.querySelector(params.el);
        this.tpl = document.querySelector(params.tpl);

        this.dep = new Dep();
        this.data = params.data;

        this.init();
    }

    init(){
        this.observe(this.data);
        this.render();
    }

    render(){
        var htm = this.tpl.innerHTML,
            data = this.data;

        laytpl(htm).render(data, (html)=>{
            this.el.innerHTML = html;
        })
    }

    defineReactive(obj, key, val) {
    	// 递归监听子属性
        this.observe(val); 
        
        Object.defineProperty(obj, key, {
            enumerable: true,
            get: ()=>{
                return val;
            },
            set: (data)=>{
                val = data;
                this.dep.notify(data);
            }
        });
    }
	
  	// 绑定发布者
    observe(obj) {
        if (!obj || typeof obj !== 'object') {
            return;
        }

        Object.keys(obj).forEach((key) => {
            this.defineReactive(obj, key, obj[key]);
            this.dep.subscibe(key, ()=>{
            	// 每次数据改变都重新渲染页面，这里可以进行优化
                this.render();
            })
        });
    }
}