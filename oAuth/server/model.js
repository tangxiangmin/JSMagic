
function salt(val){
    return val + 'salt_key'
}
let accountMap = {
    'test': {
        pwd: salt('123456'),
        userInfo: {
            avatar: 'http://placekitten.com/100/100',
            nickname: 'shymean',
            gender: 1,
            sign: '...^_^...'
        }
    }
}
// 需要持久化保存，同时设置过期时间
let codeMap = {}

module.exports = {
    // 校验用户密码
    checkAccount(username, password){
        let user = accountMap[username]
        return user && user.pwd === salt(password)
    },
    // 获取用户基本信息
    getUserInfo(username){
        let user = accountMap[username]
        return user.userInfo
    },
    // 校验当前appId是否合法，且注册域名是否与redirectName的host保持一致
    checkAppId(appId, redirectName){
        // todo 执行校验逻辑
        return true
    },
    // 生成授权码，后续通过授权码获取用户信息
    generateCode(username){
        let rdmStr = Math.random().toString(36).substr(2);
        // 关联userName和rdmStr，方便后面通过rdmStr查询到基础信息
        codeMap[rdmStr] = {
            username,
            createdTime: Date.now()
        }
        return rdmStr
    },

    // 根据code获取username
    checkCode(code){
        let val = codeMap[code]
        if(!val) throw new Error('code无效')

        const {username, createdTime} = val
        const EXPIRED_TIME = 30*60*1000 // 过期时间30分钟
        if(Date.now() - createdTime > EXPIRED_TIME) throw new Error('code过期')
        return username
    }
}