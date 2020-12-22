function test1() {
    if (isApp) {
        a();
    } else {
        b();
    }
    c();

    if (isApp) {
        d();
    } else {
        e();
    }
}

function test2() {
    const appHanlder = () => {
        a();
        c();
        d();
    };
    const defaultHandler = () => {
        b();
        c();
        e();
    };

    if (isApp) {
        appHanlder();
    } else {
        defaultHandler();
    }
}

function test3() {
    const sellPage = {
        template: `
        <div class="page">
            <slot></slot>
        </div>
        `,
        methods: {
            fetchDetail() {
                // 获取商品详情
            },
            confirmPay(item) {
                // 根据商品拉起支付
            },
        },
    };

    const A = {
        components: {
            sellPage,
        },
        template: `
        <div>
            <sellPage ref="sellPage"> 
                <!--商品A详情-->
                <button @click="showSkuList">立即购买</button>
            </sellPage>
            <skuList v-show="skuVisible" @confirm="confirmBuy"/>
        </div>
        `,
        data() {
            return {
                skuVisible: false,
            };
        },
        methods: {
            showSkuList() {
                this.skuVisible = true;
            },
            confirmBuy(item) {
                this.$refs.sellPage(item);
            },
        },
    };
    const B = {
        components: {
            sellPage,
        },
        template: `
        <div>
            <sellPage>
                <!--商品B详情-->
            </sellPage>
        </div>
        `,
        methods: {
            confirmBuy(item) {
                this.$refs.sellPage(item);
            },
        },
    };
}
