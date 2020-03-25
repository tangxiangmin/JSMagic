const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const views = require("koa-views");
const bodyParser = require("koa-bodyparser");
const axios = require('axios')

const app = new Koa();
const router = new Router();
app.use(bodyParser());


const PORT = 3002;

const APIURL = 'http://localhost:3001'

app.use(
    views(path.resolve(__dirname, "./"), {
        extension: "ejs"
    })
);

router.get('/', async (ctx) => {
    const {code} = ctx.query
    if (!code) {
        return ctx.redirect('/login')
    }

    // 使用code调用第三方接口获取用户基本信息
    let res = await axios.get(`${APIURL}/userInfo`, {
        params: {code}
    }).then(res => res.data)

    if (res.code === 0) {
        await ctx.render('index', {
            ...res.data
        })
    } else {
        ctx.body = `获取用户信息失败:${res.msg}`
    }

})


router.get('/login', async (ctx) => {
    const appId = '123213'
    const redirect = `http://localhost:${PORT}`
    await ctx.render('login', {
        oAuthUrl: `${APIURL}/oauth?appid=${appId}&redirect=${redirect}`
    })
})


app.use(router.routes()).use(router.allowedMethods());


app.listen(PORT);
console.log(`customer listen at ${PORT}`);
