// 参考：[凯撒密码](https://zh.wikipedia.org/wiki/%E5%87%B1%E6%92%92%E5%AF%86%E7%A2%BC)
// 将整个字符串按照约定的偏移量进行移动，并返回新的字符串


/**
 * 
 * @param {*} val 需要加密的数据
 * @param {*} secretKey 约定的密钥，用于加密数据
 */
function encrypt(val, secretKey) {
    // 假装这里面做了一系列很复杂的操作
    return val.split('').map(ch => String.fromCharCode(ch.charCodeAt(0) + secretKey % 26)).join('')
}

/**
 * 
 * @param {*} data 密文
 * @param {*} secretKey 加密时约定的密钥，用于解密密文 
 */
function decrypt(data, secretKey) {
    return data.split('').map(ch => String.fromCharCode(ch.charCodeAt(0) - secretKey % 26)).join('')
}

test()

function test() {
    const secretKey = 10 // 约定的密钥

    var originData = "hello, I'm originData" // 原始明文

    var secretData = encrypt(originData, secretKey) // 发送方使用密钥加密数据

    console.log(secretData) // rovvy6*S1w*y|sqsxNk~k，不知道密钥的话，无法直接猜出这个密文的原始含义

    console.log(originData === decrypt(secretData, secretKey)) // 接收方使用同样的密钥解密数据
}
