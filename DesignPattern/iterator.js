const PAGE_TYPE = {
    app: "app", // app
    wx: "wx", // 微信
    tiktok: "tiktok", // 抖音
    bili: "bili", // B站
    kwai: "kwai", // 快手
};
function getPageType() {
    const ua = navigator.userAgent;
    let pageType;
    // 移动端、桌面端微信浏览器
    if (/xxx_app/i.test(ua)) {
        pageType = app;
    } else if (/MicroMessenger/i.test(ua)) {
        pageType = wx;
    } else if (/aweme/i.test(ua)) {
        pageType = tiktok;
    } else if (/BiliApp/i.test(ua)) {
        pageType = bili;
    } else if (/Kwai/i.test(ua)) {
        pageType = kwai;
    } else {
        // ...
    }

    return pageType;
}


function isApp(ua){
    return /xxx_app/i.test(ua)
}

function isWx(ua){
    return /MicroMessenger/i.test(ua)
}

function isTiktok(ua){
    return /aweme/i.test(ua)
}

function isBili(ua){
    return /BiliApp/i.test(ua)
}

function isKwai(ua){
    return /Kwai/i.test(ua)
}

function getPageType2(){
    let platformList = [
        { name: 'app', validator: isApp },
        { name: 'wx', validator: isWx },
        { name: 'tiktok', validator: isTiktok },
        { name: 'bili', validator: isBili },
        { name: 'kwai', validator: isKwai },
    ]

    const ua = navigator.userAgent;
    for(let {name, validator} in platformList){
        if(validator(ua)){
            return name
        }
    }
}