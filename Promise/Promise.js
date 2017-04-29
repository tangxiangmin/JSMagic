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