oAuth 授权demo
===


## 步骤
```bash
npm i 
# 启动授权服务器
npm run server

# 启动业务服务器
npm run customer
```
然后浏览器输入`localhost:3002`即可

## 原理
参考：
* [理解OAuth 2.0](http://www.ruanyifeng.com/blog/2014/05/oauth_2_0.html)

* 首先需要去对应的平台申请`client_id`和密钥`client_sercet`
* 然后指定对应的回调地址，通过`client_id`，跳转到平台的登录界面
* 用户完成登录后，平台会访问先前指定的回调地址，并附带对应的`code`
* 通过`code`获得对应的`access_token`，然后可以根据`access_token`执行一些权限操作，比如访问用户基本资料啥的
* 最后可以绑定平台账号和自己网站的用户账号，整个认证登录完成

以QQ快速登录为例
* 用户点击QQ快速登录，后端拼接QQ认证链接（包含redirect_url参数），重定向到QQ认证页面
* 用户QQ授权完成，QQ服务器请求redirect_url链接并携带code
* 后端接收到redirect_url上的code参数，使用该参数调用QQ对外的API，获取用户access_token
* QQ服务器校验code，合法则返回access_token
* 后端使用access_token获取用户基本信息，绑定用户与本站点的账号，用户登录成功
