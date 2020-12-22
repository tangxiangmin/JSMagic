

class Singleton {

    instance = null
    getInstance(...args){
        console.log(this.instance)
        if(this.instance){
            return  this.instance
        }
        return new Singleton(...args)
    }
}


// 通用的缓存某个函数执行结果的方法，按照约定fn如果返回truth的值，这样可以保证fn只会被调用一次，
// let getSingleton = function( fn ){
//     let result;
//     return function(){
//         return result || ( result = fn .apply(this, arguments ) );
//     }
// };

function getSingleton(ClassName){
    let instance
    return ()=>{
        if(!instance)  {
            instance = new ClassName()
        }
        return instance
    }
}

class MessageBox {
    show(){
        console.log('show')
    }
    hide(){}

    static getInstance(){
        if(!MessageBox.instance) {
            MessageBox.instance = new MessageBox()
        }
        return MessageBox.instance
    }
}


const createMessageBox = getSingleton(MessageBox)
let box1 = createMessageBox()
let box2 = createMessageBox()

console.log(box1 === box2)

console.log(MessageBox.instance)

let box3 = MessageBox.getInstance()
let box4 = MessageBox.getInstance()

console.log(box3 === box4)