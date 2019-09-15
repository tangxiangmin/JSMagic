// HTTPS建立连接的伪代码

// step1: 客户端请求
var 客户端支持的算法 = client.获取支持的加密和hash算法();
client.发送(客户端支持的算法);


// step2: 服务端发送证书
var { 客户端支持的算法} = server.解析响应()
var { 对称加密算法, hash算法 } = server.选择一种客户端支持的加密算法(客户端支持的算法);
var 证书 = server.获取证书(发证机构, 公钥);
server.发送(证书, hash算法, 对称加密算法);

// step3: 客户端收到证书
var { 证书, hash算法, 对称加密算法 } = client.解析响应();
if(client.检测证书合法性(证书)){
    var {公钥} = client.获取证书公钥(证书)
    var 对称算法密钥 = client.生成对称算法密码(random())

    var 消息M = client.使用公钥加密密钥(公钥, 对称算法密钥)
    var 消息验证值V = client.生成hash验证值(hash算法, 对称算法密钥);

    client.发送(消息M, 消息验证值V)
}else {
    连接失败;
}

// step4: 服务端收到消息和验证值
var { 消息M, 消息验证值V } = server.解析响应();
var 解密结果R = server.使用私钥解密(消息M)
var 消息验证值V1 = server.生成hash验证值(hash算法, 解密结果R);
if (消息验证值V1 == 消息验证值V){
    var 对称算法密钥 = 解密结果R; 

    var 握手终止报文 = server.生成报文(对称加密算法, 对称算法密钥, "握手终止消息");
    server.发送(握手终止报文);
}else {
    客户端发送的对称算法密钥 != 服务端收到的对称算法密钥
    连接失败
}

// step5: 客户端接收到握手终止消息
var { 报文 } = client.解析响应();
let { 握手终止报文 } = client.解析报文(对称加密算法, 对称算法密钥, 报文);
if (握手终止报文){
    对称算法密钥传输成功
    开始对称加解密传输
}else {
    对称算法使用对称算法密钥解密失败
}