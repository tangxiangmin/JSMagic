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
			console.log(route);
			route && this.routeHandle(route);
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