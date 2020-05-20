
let activeEffect
let targetMap = new Map()

function reactive(obj){
    return new Proxy(obj, {
        get(target, key){
            track(target, key)
            return target[key]
        },
        set(target, key, value){
            target[key] = value
            trigger(target, key)
            return true
        }
    })
}

function track(target, key){
    let depMap = targetMap.get(target)
    if(!depMap) {
        targetMap.set(target, (depMap = new Map()))
    }
    let dep = depMap.get(key)
    if(!dep) {
        depMap.set(key, ( dep = new Set()))
    }
    if(!dep.has(activeEffect)){
        dep.add(activeEffect)
    }
}

function watchEffect(cb){
    activeEffect = cb
    cb()
}

function trigger(target, key){

    let depMap = targetMap.get(target)
    if(!depMap) return 
    let effects =  depMap.get(key)
    if(!effects) return 
    
    effects.forEach((effect)=>{
        effect()
    })
}

module.exports = {
    reactive,
    watchEffect
}