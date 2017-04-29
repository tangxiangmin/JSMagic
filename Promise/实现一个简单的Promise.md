---
title: 实现一个简单的Promise
date: 2017-04-25 22:46:29
tags:
	- Promise
categories:
	- JavaScript
---
回调函数在JavaScript中随处可见，在NodeJS中更是家常便饭，随着而来的就是__回调地狱__。尽管早有耳闻，也知道`Promise`是解决回调地狱的一种方法，却只是简单地了解几个API。最近在看`axios`的源码，发现拦截器`interceptors`那里的实现也是基于`Promise`的，加上阅读《你不知道的JavaScript（中卷）》的时候，书中花了一半的篇幅讲解`Promise`，然而却一脸懵比。现在 是时候弄清楚`Promise`的真面目了。

<!--more-->

现在是2017年，网上已经有了大量的关于`Promise`的文章，本文参考下面文章，结合我自己的理解，实现一个简单的`Promise`对象和`then`方法：
* [JavaScript Promise：简介](https://developers.google.com/web/fundamentals/getting-started/primers/promises)
* [教你一步一步实现一个Promise](http://www.cnblogs.com/ygm125/p/3735677.html?utm_source=tuicool&utm_medium=referral)
* [大白话讲解Promise](http://www.cnblogs.com/lvdabao/p/es6-promise-1.html)

## 简介
首先需要明白的是`Promise`到底是什么东西，上面的文档多多少少提到了一些，还是让我们打开[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)看一看。
> Promise实例是一个代理对象，被代理的值在该实例被创建时可能是未知的（也可能是已知的，但是都将他们看作是未知异步的）。该实例允许我们为异步代码注册相应的成功和失败处理函数，并允许我们像使用同步代码一样使用异步返回值（这正是“代理”的含义，指代了未来的数据值）

概念总是模糊的，让我们先看看Promise提供的一些接口（现在的浏览器基本上都内置了Promise对象，所以放心大胆的测试吧）。
### 基本用法
下面代码模拟了一次异步的请求，并假设返回一个`data`数据。
```
var p = new Promise((resolve, reject)=>{
	console.log("send request...");
 	setTimeout(()=>{
        var data = "hello";
        console.log("get data " + data);
        resolve(data);
    },1000);
})

// 调用then并"提前"使用data
p.then((res)=>{
	console.log(res);
})
```
Promise构造函数接受一个函数`resolver`作为参数，并在构造函数内部会调用这个`resolver`函数，通常情况下`resolver`会执行一些异步操作。

我们知道，JavaScript的同步代码是会先于异步代码执行的（不论代码块出现的先后顺序），上面在异步代码setTimeout还并没有执行的时候，对象`p`已经实例化完成并调用了`then`方法。

### then
`then`方法接收两个参数，第一个参数为前面的`resolver`异步执行成功对应的回调，第二个参数为异步执行失败对应的回调函数。
前面提到，当异步代码还没有执行的时候，我们就注册了对应的处理函数。这是显而易见的，比如`$.post(url, postdata, function(res){},'json')`一样，我们也是需要先注册一个使用异步请求返回的数据`res`作为参数的回调函数。`then`方法与前面这种注册回调函数的方法并没有什么不同，都需要使用异步数据作为参数。
但是！！如果此时需要根据`res`发起另外一个异步请求的时候，情况就有很大的不同了：
* 在使用回调函数的情形中，需要在回调函数中嵌套异步请求并继续注册回调函数，如果继续嵌套，宾果，回调地狱就这么来了
* 在`Promise`的`then`中如果返回一个新的`Promise`对象，则就可以继续调用`then`方法并处理异步数据，继续异步则形成的是链式调用而不是回调嵌套

下面是简单的描述代码
```
// 回调地狱
$.post(url1, postdata1, (res1)=>{
  	// 处理res1并生成postdata2
  	$.post.(url2, postdata2, (res2)=>{
      	// 处理res2并生成postdata3...
      	// $.post...
  	}, 'json')
}, 'json');

// Prmise
var p = new Promise((resolve, reject)=>{
  	$.post(url, postdata, (res)=>{
      	resolve(res);
  	}, 'json')
});

p.then((res)=>{
	// 处理res1并生成postdata2
    console.log("first get: " + res['id']);
    return new Promise((resolve, reject)=>{
      	$.post('1.php', res, (res)=>{
      		resolve(res);
      	},'json')
	})
}).then((res2)=>{
	// 处理res1并生成postdata3
	console.log("second get: " + res['id']);
})
```
可以看见，相对于嵌套的回调函数，使用`then`注册的异步处理函数都是“平行的”，也就不存在多重嵌套了。

## 实现
`Promise`最需要理解的就是它的构造函数和`then`方法的实现，下面就让我们一步一步实现一个最基本的Promise对象。
从文档中了解到，一个Promise在可能具备三种状态：
* 初始状态`pendding`
* 异步操作成功状态`fulfilled`
* 异步操作失败状态`rejected`

也就是说，只能能发生下面两种情况中的某一种，异步操作要么成功，要么失败，这是显而易见的：
* `pendding`到`fulfilled`，此时执行`reslove`
* `pendding`到`rejected`，此时执行`reject`

### 基本封装
需要注意的是，在实例化对象的时候，参数只是一个`reslover`闭包函数名，并没声明具体的`reslove`或者`reject`，这意味着我们必须自己在内部实现`reslover`的调用，然后在调用`then`方法的时候使用其参数进行。还是看代码吧
```javascript
!(function(){
	const PENDING = 0,
		  FULFILLED = 1,
		  REJECTED = 2;

	class Promise {
		constructor(resolver){
			// 维持异步状态
			this.status = PENDING;

			// 保存异步回调函数
			this.onfulfilled;
			this.onrejected;

			// 保存异步操作结果
			this.value;

			// 定义reslove和reject，执行异步操作，并在异步结果完成时手动调用reslove或者reject
			// reslove和reject在内部
			// 		1.负责改变当前promise的状态
			// 		2.调用then方法指定的onfulfilled或onrejected
			resolver((value)=>{
				this.status = FULFILLED;
				this.onfulfilled(value);
			}, (value)=>{
				this.status = REJECTED;
				this.onrejected(value);
			});

			// 构造函数返回当前promise对象
			// 该对象包含value，reason和status属性，并在其then方法中使用这些值
		}

		then(onfulfilled, onrejected){
			// 由于同步代码会先于异步代码执行，因此在then方法中为promise对象是完全没有问题的
            // 如果reslover本身就是同步代码，则会立即改变status，因此需要根据status选择执行对应的逻辑
			switch(this.status){
				case PENDING:
					this.onfulfilled = onfulfilled;
					this.onrejected = onrejected;
					break;
				case FULFILLED:
					onfulfilled(this.value);
					break;
				case REJECTED:
					onrejected(this.reason);
					break;
			}

		}
	}

	window.Promise = Promise;

})(window);
```
上面的代码去掉注释也没几行了，实际上现在的这个`Promise`跟常规的回调函数处理异步方式并没有什么区别，除了在`then`中注册回调函数导致代码看起来更加绕了，别走开，后面才有趣，在此之前先让我们测试一下这个版本
```javascript
new Promise((resolve, reject)=>{
    setTimeout(function(){
        var data = "hello from future!";
        resolve(data);
    }, 1000);
}).then((data)=>{
    console.log(data); // "hello from future!"
})
```
这里就没有测试`reject`的情况了，可以看见，仍旧是需要我们手动去触发`resolve`并通知异步完成。

### 同步转异步
上面的代码还存在很多问题，在测试同步代码的时候是会报错的，因为`resolve`内部调用了`this.onfulfilled`，如果是同步代码，在执行`then`方法的时候`status`已经不是`PENDING`状态了；`Promise`有一个核心的思想：“不论是同步代码还是异步代码，都一并视为异步处理”（这句话是在《你不知道的JavaScript(中卷)》看见的）。另外`reslove`和`reject`的逻辑基本相似，我们应该整理一下：
```javascript
// 重写constructor
constructor(){
	resolver((value)=>{
        this.updateStatus(FULFILLED, value);
    }, (reason)=>{
        this.updateStatus(REJECTED, value);
    });
}

// 统一处理状态改变
updateStatus(status, value){
    // resolver只处理成功或者失败
    if (this.status === PENDING){
        // 即使是同步的代码，这里也转换为异步执行，保证then方法是先执行的
        setTimeout(()=>{
            this.status = status;
            this.value = (this.status === FULFILLED) ?
                         (this.onfulfilled && this.onfulfilled(value)) :
                         (this.onrejected && this.onrejected(value));
            this.onfulfilled = this.onrejected = null;
        });
    }
}
```
现在测试同步代码也会成功了，原因就在于`updateStatus`内部使用一个定时器将同步或异步代码都转换成异步代码执行，保证了`then`方法的优先调用！

### 链式调用
上面的代码保证了在异步代码外部的`then`方法中注册回调函数，那么，嵌套异步转链式调用是怎么实现的呢？
在`jQuery`中，通过为接口返回`this`实现链式调用，同理，我们在`then`方法中返回一个新的`Promise`实现链式调用，由于`then`方法接受的是`onfulfilled`和`onrejected`，因此这里我们需要自己实现这个返回的`promise`对象的`reslover`参数。

需要注意的是，并不是每个`onfulfilled`都必须返回新的`Promise`对象，如果异步嵌套结束了，我们就没必要再实例一个`Promise`了。也就是说，这里需要有一个判断`onfulfilled`是否返回了`Promise`对象的方法，常规的做法是使用“鸭子类型”：只要对象具有`then`方法，那么他就是一个`primise`对象。
```javascript
const isThenable = function(obj) {
    return obj && typeof obj['then'] == 'function';
}
```

下面是改进后的`then`方法
```javascript
then(onfulfilled, onrejected){
	return new Promise((resolve, reject)=>{
        let success = (value)=>{
            // 这里执行onFulfilled，判断是否是promise对象并将返回结果作为参数传递到当前promise的reslove中
            // 如果没有返回值，则默认返回原本的value值，这一步的处理并不是必须的
            let result = onfulfilled(value) || value;
            if (isThenable(result)){
                result.then((value)=>{
                    resolve(value);
                }, (value)=>{
                    reject(value);
                });
            }else {
                resolve(result);
            }
        }

        let error = (value)=>{
            let result = onrejected(value) || value;
            resolve(result);
        }

        switch(this.status){
            case PENDING:
            	// 将原本的onfulfilled和onrejected替换成新的处理函数，并在内部手动调用resolve和reject
                this.onfulfilled = success;
                this.onrejected = error;
                break;
            case FULFILLED:
                success(this.value);
                break;
            case REJECTED:
                error(this.reason);
                break;
        }
    })
}
```
老规矩，先测试一下
```javascript
new Promise((res, rej)=>{
    // 异步测试
    setTimeout(function(){
        var data = "hello from future!";
        res(data);
    }, 1000);
    // 同步测试
    // var data = "hello from future!";
    // res(data);
}).then((data)=>{
    console.log(data); // hello from future!
    return new Promise((reslove, reject)=>{
        setTimeout(()=>{
            data += "--No.2";
            reslove(data);
        }, 1000);
    })
}).then((data)=>{
    console.log(data); //hello from future!--No.2
})
```

大功告成！
### 总结
附上整份源码(绝对没有凑字数的嫌疑)：
```javascript
!(function(){
	const PENDING = 0,
		  FULFILLED = 1,
		  REJECTED = 2;

  	const isThenable = function(obj) {
        return obj && typeof obj['then'] == 'function';
    }

	class Promise {
		constructor(resolver){
			// 维持异步状态
			this.status = PENDING;

			// 保存异步回调函数
			this.onfulfilled;
			this.onrejected;

			// 保存异步操作结果
			this.value;

			// 定义reslove和reject，执行异步操作，并在异步结果完成时手动调用reslove或者reject
			// reslove和reject在内部
			// 		1.负责改变当前promise的状态
			// 		2.调用then方法指定的onfulfilled或onrejected
			resolver((value)=>{
				this.updateStatus(FULFILLED, value);
			}, (reason)=>{
				this.updateStatus(REJECTED, value);
			});

			// 构造函数返回当前promise对象
			// 该对象包含value，reason和status属性，并在其then方法中使用这些值
		}

		updateStatus(status, value){
			// resolver只处理成功或者失败
			if (this.status === PENDING){
				// 即使是同步的代码，这里也转换为异步执行，保证then方法是先执行的
				setTimeout(()=>{
		            this.status = status;
		            this.value = (this.status === FULFILLED) ? 
		            			(this.onfulfilled && this.onfulfilled(value)) : 
		            			(this.onrejected && this.onrejected(value));

			       	this.onfulfilled = this.onrejected = undefined;
				});
			}
		}


		then(onfulfilled, onrejected){
			// 由于同步代码会先于异步代码执行，因此在then方法中为promise对象是完全没有问题的
			// 如果reslover本身就是同步代码，则会立即改变status，因此需要根据status选择执行对应的逻辑
			// 每个then方法都返回一个新的promise对象，实现链式调用

			return new Promise((resolve, reject)=>{

				let success = (value)=>{
					// 这里执行onFulfilled，判断是否是promise对象并将返回结果作为参数传递到当前promise的reslove中
					// 如果没有返回值，则默认返回原本的value值，这一步的处理并不是必须的
					let result = onfulfilled(value) || value;
					if (isThenable(result)){
						result.then((value)=>{
	                        resolve(value);
	                    }, (value)=>{
	                        reject(value);
	                    });
					}else {
						resolve(result);
					}
				}

				let error = (value)=>{
					let result = onrejected(value) || value;
					resolve(result);
				}

				switch(this.status){
					case PENDING:
						this.onfulfilled = success;
						this.onrejected = error;
						break;
					case FULFILLED:
						success(this.value);
						break;
					case REJECTED:
						error(this.reason);
						break;
				}
			})
		}
	}

	window.Promise = Promise;

})(window);
```

## 进阶
实现了`Promise`的构造函数和`then`方法，整个`Promise`就掌握了一大部分。除了最基本的使用之外，`promise`还提供了几个常用的方法：
* `all`，该方法接受一个promise对象数组，且只有当全部的对象都执行成功之后才会触发成功
* `race`，方法接受一个promise对象数组，只要某一个对象执行成功，父promise就会成功
* `reject`，调用Promise的rejected句柄，并返回这个Promise对象
* `reslove`，用成功值value完成一个Promise对象，这是一个很常用的方法！

上面的方法就不一一实现了，本来只是为了实现一个简单的`Promise`对象而已嘛，这是万万不能用在生产环境中的。写完这98行代码，应该是不用再死记硬背`Promise`的使用方法了。