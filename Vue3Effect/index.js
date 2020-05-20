
let {reactive, watchEffect} = require('./reactive')


let state = reactive({
    x: 100
})

watchEffect(()=>{
    let msg = `render template with state.x = ${state.x}`
    console.log(msg)
})

setTimeout(()=>{
    state.x = 200
    state.x = 300
}, 1000)