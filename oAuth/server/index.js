const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const views = require("koa-views");
const bodyParser = require("koa-bodyparser");

const UserModel = require("./model");

const app = new Koa();
const router = new Router();
app.use(bodyParser());

app.use(
    views(path.resolve(__dirname, "./"), {
        extension: "ejs"
    })
);

// router
router.get("/oauth", async ctx => {
    const { redirect, appId } = ctx.query;
    await ctx.render("login", {
        redirect,
        appId
    });
});

// 登录接口
router.post("/login", async ctx => {
    // ctx.body = "hello";
    const body = ctx.request.body;
    const { account, password, redirect, appId } = body;

    const isPass = UserModel.checkAccount(account, password);

    if (!isPass) {
        ctx.body = {
            code: 400,
            message: "登录失败"
        };
    } else {
        // 生成code
        let code = UserModel.generateCode(account)

        let url = new URL(redirect)
        url.searchParams.append('code', code)
        
        ctx.redirect(url.toString());
    }
});

// 根据code获取用户基本数据
router.get('/userInfo', (ctx)=>{
    let {code} = ctx.query
    try {
        let username = UserModel.checkCode(code)
        let userInfo = UserModel.getUserInfo(username)
        ctx.body = {
            code: 0,
            data: userInfo
        }
    }catch(e){
        ctx.body = {
            code: -1,
            msg: e.toString()
        }
    }
})

// start
app.use(router.routes()).use(router.allowedMethods());

const port = 3001;
app.listen(port);

console.log(`oauth server listen at ${port}`);
