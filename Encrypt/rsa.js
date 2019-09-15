
// 参考 https://blog.csdn.net/weixin_37887248/article/details/82805508
// RSA原理：RSA算法基于一个十分简单的数论事实：将两个大素数相乘十分容易，但是想要对其乘积进行因式分解却极其困难，因此可以将乘积公开作为加密密钥
// (1)选择两个不同的大素数p和q；
// (2)计算乘积n=pq和Φ(n)=(p-1)(q-1)；
// (3)选择大于1小于Φ(n)的随机整数e，使得gcd(e,Φ(n))=1；注：gcd即最大公约数。
// (4)计算d使得d*e=1mod Φ(n)；注：即d*e mod Φ(n) =1。
// (5)对每一个密钥k=(n,p,q,d,e)，定义加密变换为Ek(x)=xe mod n，解密变换为Dk(x)=yd mod n，这里x,y∈Zn；
// (6)p,q销毁，以{e,n}为公开密钥，{d,n}为私有密钥。

function rsa(baseNum, key, message) {
    if (baseNum < 1 || key < 1) {
        return 0;
    }
    let rsaMessage = 0;

    rsaMessage = Math.round(Math.pow(message, key)) % baseNum;
    return rsaMessage;

}

test()
function test() {
    var baseNum = 3 * 11 // n=pq=33, Φ(n)=(p-1)(q-1) = 20
    // 选择大于1小于Φ(n)的随机整数e，满足gcd(e,20)=1，且则d*e=1 mod Φ(n)， 可取e=3,d=7
    var publicKey = 3
    var privateKey = 7

    // 因此取计算结果{baseNum, publicKey}作为公钥，{baseNum, privateKey}作为私钥
    var msg = 24 // 需要加密的数据
    // 只需要约定一个加密算法，发送方使用公钥进行加密
    var encodeMsg = rsa(baseNum, publicKey, msg)
    // 接收方使用私钥进行解密，私钥不参与通信且很难被破解，因此可以保证整个数据的安全
    var decodeMsg = rsa(baseNum, privateKey, encodeMsg);
    // decodeMsg === msg，数据还原
    console.log({ msg, encodeMsg, decodeMsg, }) 
}
