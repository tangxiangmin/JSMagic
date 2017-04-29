---
title: history与单页面应用路由
date: 2017-04-09 08:50:48
tags:
	- vue
	- BOM
categories:
	- JavaScript
---

在之前的[BOM基础知识](#/title/BOM基础知识)中提到了History对象，提供浏览器历史纪录相关的接口，可以通过`window.history`对象来模拟工具栏的前进，后退和刷新。HTML5为history对象增加了几个新的方法，可以更灵活的操作历史记录。

<!--more-->
参考：
* [操纵浏览器的历史记录](https://developer.mozilla.org/zh-CN/docs/DOM/Manipulating_the_browser_history)
* [实现一个小型路由](https://segmentfault.com/a/1190000007166839)
* [利用pushState开发无刷页面切换](http://www.cnblogs.com/flash3d/archive/2013/10/23/3384823.html)

## 模拟历史纪录
在学习数据结构栈的时候，提到栈的一个常见应用场景就是历史纪录的实现。我写了一个简单的demo来模拟浏览器的历史纪录管理，只是简单实现了前进后退功能，以及模拟在某条记录点击新链接会重置新的前进按钮的情景，而诸如边界检测这些细节就没有进行处理了。

通过挪动游标的位置显示对应的记录，呈现出的就是“当前页面”，“当前页面”始终处于栈顶（这只是我自己的理解，能够解释插入历史记录的问题，但是如果当前页面处于栈顶，前进功能是怎么实现的呢？）。
```javascript
class myStack{
    constructor(){
        this.data = [];
    }
    push(item){
        this.data.push(item);
    }
    pop(){
        return this.data.pop();
    }
    clear(){
        this.data = [];
    }
    getTop(){
        var len = this.data.length;
        return this.data[len - 1];
    }
    toString(){
        return this.data.reduce((acc, val)=>{
            return acc + val + " | ";
        }, ' | ')
    }
}

class myHistory{
    constructor(){
        // 使用两个栈来保存历史历史
        this.prevStack = new myStack();
        this.nextStack = new myStack();
    }

    getCurpage(){
        // 保证当前页面在prevStack的栈顶
        return this.prevStack.getTop();
    }

    show(){
        console.log("当前位于" + this.getCurpage());
        console.log("prevStack: " + this.prevStack);
        console.log("nextStack: " + this.nextStack);
    }

    // 访问记录是在prevStack栈增加
    visit(item){
        this.prevStack.push(item);
    }

    // 模拟在某个页面点击新的链接，会丢失之前保留的历史纪录
    change(item){
        this.visit(item);
        this.nextStack.clear();
    }

    // 前进和后退
    prev(){
        var tmp = this.prevStack.pop();
        this.nextStack.push(tmp);
    }
    next(){
        var tmp = this.nextStack.pop();
        this.prevStack.push(tmp);
    }
}

// 测试
var his = new myHistory();
for (var i = 0; i < 5; ++i){
    his.visit(i + ".html");
}

his.show();

prev.onclick = function(){
    his.prev();
    his.show()
}
next.onclick = function(){
    his.next();
    his.show()
}

jump.onclick = function(){
	var page = getRandomPage();
    his.change(page);
    his.show()
}

function getRandomPage(){
    var name = Math.floor(Math.random()*100 + 100);
    return name + '.html';
}
```

## 操作历史纪录
上面的demo写的十分简陋，不过也可以用来理解浏览器中历史记录栈的一些特性。
HTML5引进了`history.pushState()`方法和`history.replaceState()`方法，它们允许你逐条地添加和修改历史记录条目。
* __逐条__的参考位置是基于当前页面的（也就是demo中的`getCurpage`返回的页面）。
* __添加和修改__表示之前只能由浏览器负责维护的历史纪录栈（demo中只能通过`prev`,`next`,`jump`这三个按钮来操作his对象），现在可以由开发者控制了

### pushState
####  参数

`pushState`接受3个参数，在[MDN](https://developer.mozilla.org/zh-CN/docs/DOM/Manipulating_the_browser_history)上有详细的解释：
* `stateObj`状态对象，可以用来记录当前这条历史纪录的一些自定义信息
* 第二个参数原本是历史纪录的标题，但是某些浏览器并不会生效（我测试了很多浏览器都不会生效），建议传入空字符串或null，也可以直接忽略这个参数。
* 第三个参数是需要增加的历史纪录的地址，可以是绝对路径也可以是相对路径，需要注意的是相对路径受[同源策略](#/title/浏览器中的跨域)的限制

```javascript
// 1.html
<style>
    [id^='page'] {
        height: 500px;
        border: 1px solid #dedede;
        margin-bottom: 100px
    }
</style>
<button id="btn2">history</button>
<div id="page1">page1</div>
<div id="page2">page2</div>
<div id="page3">page3</div>
<div id="page4">page4</div>

// script
!(function(){
    var count = 1;
    btn2.onclick = function(){
    	var name = "3.html";
        var stateObj = {
        	name: name,
        }
        history.pushState(stateObj, null, name);
        count++;
    }
})()
```
#### 操作流程
在上面的例子中点击按钮可以发现，浏览器地址栏会根据`pushState`接收的url参数而变化，但是不会主动加载对应的url（如果访问则理论上应该跳转到`3.html`），甚至都不会去检测该url对应的资源是否存在。

关于这点，我的理解是：`pushState`只是向当前页面处于历史记录栈的位置上__平行地__添加一条记录。
* 比如用户现在位于`1.html`，跳转到`2.html`, 如现在用户导航`2.html`，原本的历史记录应该是`['1.html', '2.html']`
* 用户现在位于`1.html`，使用`pushStaet`添加了`3.html`进入历史纪录栈，然后跳转到`2.html`，现在的历史纪录变成了：`[['1.html','3.html'], '2.html']`（这里的平行效果是我自己瞎猜的）

由于平行效果，即使添加了一条历史记录，但是游标仍处于当前位置`1.html`，只有当游标移动到下一个页面`2.html`，才会真正开始读取添加的那一条历史记录，也就是`3.html`。

接着上面的场景，假设用户现在位于`2.html`，然后进行下面的操作：
* 用户点击了后退按钮，根据历史记录返回到`3.html`，此时的文档内容`3.html`（而不是进入`3.html`的`1.html`，是不是很神奇）。此时页面上的window对象会触发`popstate`事件（马上就会提到）。
* 再次点击后退按钮，此时浏览器返回到`1.html`，同时也触发一个`popstate`事件，不过此时的对象状态是null，且文档内容不会改变（仍旧保留`3.html`文档的内容，换句话说，我们回不到真正应该保留的`1.html`文档上去了）

关于`pushState`还有两个需要注意的地方：
* 每调用一次，都会添加一条历史记录，即使是相同的url参数也会根据调用次数生成多条记录，这可能导致连续点多次返回按钮页面毫无变化的情形
* 相对路径不仅仅可以是其他文档，也可以只是修改当前文档url的片段标识符（`#`后面的内容）。实际上，接下来要实现的单页面应用的路由，就是通过修改片段标识符实现的

### replaceState
`replaceState`与`pushState`类似，但是浏览器并未在当浏览历史栈中增加浏览器的历史记录，而是使用新的历史记录替换当前页面在历史记录栈中的记录。
将上面的代码修改为`replaceState`（PS：可能需要使用`ctrl+r`强制刷新）
```javascript
history.replaceState(stateObj, null, "3.html");
```
然后进入`2.html`点击回退按钮，可以看见浏览器直接会退到`3.html`，而`1.html`的历史纪录彻底消失了。
> 当你为了响应用户的某些操作，而要更新当前历史记录条目的状态对象或URL时，使用replaceState()方法会特别合适。

### popstate
#### 触发事件
前面在回退时提到了`popstate`事件关于`popstate`事件有下面两点需要注意:
* 只会在浏览器某些行为下触发，比如点击前进后退按钮，使用`histroy.back()`,`history.go()`等方法，但是调用`pushState`和`replaceState`方法并不会触发该事件
* 只有当前页面的历史记录（文档上的描述是出于激活状态的历史纪录条目）发生变化时才会触发。

第一条是触发`popstate`的场景，而第二条是触发`popstate`的限制。
可以使用前面提到的__平行__来理解“当前页面的历史记录变化”的问题：只有当前文档在历史记录栈的位置保存了一个平行的历史纪录数组且其长度大于1时（最少保存了两条才能够“变化”）才会触发。
也就是说，在上面的例子中，第一次点击回退按钮，从`2.html`回退到`3.html`中，是不会触发`popstate`事件的，只有再次点击回退按钮，历史纪录栈中，平行地从`3.html`回退到`1.html`，即当前页面的历史纪录发生了改变，则触发`popstate`事件，尽管此时的文档内容并不会发生改变。

#### 事件对象
`popstate`事件中的状态对象`e.state`，就是`pushState`的第一个参数stateObj的一个拷贝。需要注意的是，即使在改变历史记录时没有声明记录状态对象，在上述情况下仍旧会触发`popstate`事件。

也可以直接使用`history.state`来访问当前历史纪录条目的状态对象。跟触发`popstate`事件不同，第一次点击回退按钮，从`2.html`回退到`3.html`就可以访问到对应的历史纪录状态对象，而不必触发`popstate`事件。

#### 事件处理函数
前面反复提到的情形是：尽管再次点击了回退按钮，文档的内容并不会改变，即文档并不会刷新！这是一个很重要的特性。
通常情况下，可以使用Ajax请求数据，然后在不刷新页面的情况下改变文档内容。但是在之前，这个过程是不可以逆的，
* 点击回退按钮，浏览器并不会返回文档请求数据之前的状态，而是返回上一条历史记录（一个新文档）
* 然后点击前进按钮，浏览器却回到了文档请求数据之前的状态，根据响应数据动态渲染的页面不存在了。

现在，既然我们可以操作历史记录，当然就可以实现这个功能：无刷新页面切换（前进和后退）。具体思路就是在`popstate`事件处理函数中，根据`history.state`来决定页面的渲染内容，达到在一个页面内无刷新模拟页面前进和后退的功能（这大概就是单页面了吧）。

## 单页面应用路由
在单页应用中，利用pushState, replaceState可以改变url，同时浏览器不刷新，并且通过popstate监听浏览器历史记录的方式，完成一系列的异步动作并渲染页面内容。为了便于管理整个应用的历史记录，下面实现一个简单的路由。
### 实现路由
```javascript
class Router {
	constructor(){
		this.route = [];
	}

    // 注册路由
	addRoute(path, handle){
	    let obj = {
	        path,
	        handle
	    }

	    this.route.push(obj);
	}
    // 调用路由映射的函数
	routeHandle(path){
	    this.route.forEach((item, index) => {
	        if (item.path === path) {
	            item.handle.apply(null, [path]);
	            return true;
	        }
	    })
	    return false;
	}

	addState(stateObj){
		let url = stateObj.name
		history.pushState(stateObj, null, url);
	}

	start(){
		window.addEventListener("popstate", (e)=>{
			var route = e.state.name;

			// 根据保存的state重新渲染对应路由的页面
			// 达到无刷新回退的效果
			this.routeHandle(route);
		})

		document.addEventListener('click', (e)=>{
		    let dataset = e.target.dataset;

		    if (dataset && dataset.href) {

		    	// 防止连续添加多个state
		    	if(!history.state || !history.state.name || (history.state.name !== dataset.href)){
		    		this.addState({
				    	name: dataset.href
				    });
		    	}

  				//阻止浏览器默认行为
		        if (this.routeHandle(dataset.href)) {
		            e.preventDefault();
		        }
		    }
		})
	}
}
```
### 测试
接下来进行简单测试
```javascript
// html
<style>
    #app a {
        display: inline-block;
        width: 100px;
        margin: 0 20px;
        line-height: 40px;
        text-align: center;
        box-shadow: 1px 1px 1px 1px #ccc;
    }
    #page {
        height: 400px;
        border: 1px solid #dedede;
        margin-bottom: 20px;
    }
</style>


<div id="app">
    <div id="page"></div>
    <nav>
        <a data-href="/login">登陆</a>
        <a data-href="/signup">注册</a>
    </nav>
</div>

// script
var router = new Router();
router.start();

// 根据路由渲染页面，该功能在路由注册函数中实现，
// vue中每个路由对应的就是一个组件
var $page = document.getElementById("page");
router.addRoute('/signup', ()=>{
	$page.innerHTML = "<h1>欢迎注册</h1>";
});

router.addRoute('/login', ()=>{
	$page.innerHTML = "<h1>欢迎登陆</h1>";
})
```
当点击按钮时通过预先注册的函数在`page`元素中插入对应的视图，可以通过切换路由来切换对应的视图，且可以通过浏览器的前进和后退来实现无刷新切换历史纪录。这样，保存Ajax渲染前后的视图就可以实现了。


## 总结
今天总结了如何使用history实现一个简单的单页面路由，通过在每个路由的注册函数中执行对应的渲染任务完成无刷新切换，整理的比较草率，夹杂了大量自己的理解（很可能是错误的），肯定挖了不少坑，等后面再回来填吧。
