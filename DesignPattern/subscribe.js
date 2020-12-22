const { emit } = require("process")


function test1(){

    const activity = {
        showCouponDialog(){
            console.log('恭喜你获得优惠券')
        }
    }

    const logger = {
        pageView(page){
            reportLog('page_view', page)
        }
    }

    const indexPage = {
        mounted(){
            console.log('mounted')

            logger.pageView('index')
            activity.showCouponDialog()
        }
    }
}


function test2(){
    const eventBus = {
        on(){},
        emit(){}
    }

    const activity = {
        init(){
            eventBus.on('enterIndexPage', ()=>{
                this.showCouponDialog()
            })
        },
        showCouponDialog(){
            console.log('恭喜你获得优惠券')
        }
    }

    const logger = {
        init(){
            eventBus.on('enterIndexPage', ()=>{
                this.pageView('index')
            })
        },
        pageView(page){
            reportLog('page_view', page)
        }
    }

    const indexPage = {
        mounted(){
            console.log('mounted')
            eventBus.emit('enterIndexPage')
        }
    }

    activity.init()
    logger.init()
    indexPage.mounted()
}