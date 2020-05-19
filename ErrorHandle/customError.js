// Create an object type UserException
function UserException(message) {
    // 包含message和name两个属性
    this.message = message;
    this.name = "UserException";
}
// 覆盖默认[object Object]的toString
UserException.prototype.toString = function() {
    return this.name + ': "' + this.message + '"';
};

// 抛出自定义错误
function f(){
    try {
        throw new UserException("Value too high");
    }catch(e){
        if(e instanceof UserException){
            console.log('catch UserException')
            console.log(e)
        }else{
            console.log('unknown error')
            throw e
        }
    }finally{
        // 可以做一些退出操作，如关闭文件、关闭loading等状态重置
        console.log('done')
        return 1000 // 如果finally中return了值，那么会覆盖前面try或catch中的返回值或异常
    }
}
