

vnode相关的一些技术实现
=== 

包括
* vnode2DOM，将vnode转换为DOM节点
* vnode2HTML，将vnode转换为HTML字符串
* diff算法，可分为递归实现（Vue）和循环实现（React Fiber）


整理的开发文档位于个人博客上:
* [VNode与递归diff](https://www.shymean.com/article/VNode%E4%B8%8E%E9%80%92%E5%BD%92diff)
* [Fiber与循环diff](https://www.shymean.com/article/Fiber%E4%B8%8E%E5%BE%AA%E7%8E%AFdiff)