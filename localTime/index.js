// 倒计时
+new Date('2020-07-22 00:00:00')

function transformLocalDate(str, timezone = 8){
    let now = new Date(str);
    let offsetGMT = now.getTimezoneOffset() // 这里的单位是分钟
    let target = new Date(+now + offsetGMT * 60 * 1000 + timezone * 60 * 60 * 1000);
    return target
}

// var target = transformLocalDate('2020-07-22 00:00:00', 9)
// var origin = new Date('2020-07-22 00:00:00')
// console.log(+target)
// console.log(+origin)
// console.log(+target === +origin)


// mock 从服务端获取时间
function getServerInitTime(){
    return 1000
}

function demo1(){

    let serverInitTime, localInitTime

    async function initAdjustTime(){
        serverInitTime = await getServerInitTime(); // 接口响应时服务端的本地时间
        localInitTime = +new Date() // 初始化时用户本地时间
    }
    
    function getCurrentTime(){
        if(!serverInitTime) {
            console.error('日期校验暂未初始化')
            return 
        }
        const localCurrentTime = +new Date()
        return serverInitTime + (localCurrentTime - localInitTime)
    }
    
    async function test(){
        await initAdjustTime()
        console.log('init: ' + serverInitTime)
        document.addEventListener("click", ()=>{
            const now = getCurrentTime()
            console.log(now)
        }, false)
    }
    
    test()
}

function demo2(){
    let serverInitTime, localInitTime

    async function initAdjustTime(){
        serverInitTime = await getServerInitTime(); // 接口响应时服务端的本地时间
        localInitTime = performance.now() // 初始化时用户本地时间
    }
    
    function getCurrentTime(){
        if(!serverInitTime) {
            console.error('日期校验暂未初始化')
            return 
        }
        const localCurrentTime = performance.now()
        return serverInitTime + (localCurrentTime - localInitTime)
    }
    
    async function test(){
        await initAdjustTime()
        console.log('init: ' + serverInitTime)
        document.addEventListener("click", ()=>{
            const now = getCurrentTime()
            console.log(now)
        }, false)
    }
    
    // console.log(performance.timeOrigin)
    test()
}

// 检测本地时间戳是否改动
function checkLocalTime(){
    const timestamp = await getServerTimestamp()
    const localTimestamp = +new Date()
    const diff = 5000
    if(Math.abs(timestamp - localTimestamp) > diff){
        console.error('本地时间不准确')
    }
}

// demo1()
demo2()