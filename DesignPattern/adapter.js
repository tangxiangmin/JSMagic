function api() {
    return Promise.resolve({
        code: 0,
        data: {
            userName: 123,
        },
    });
}

function adapterApi() {
    return api().then((res) => {
        // 增加适配
        return {
            code: res.code,
            data: {
                user_name: res.data.userName,
            },
        };
    });
}

function a() {
    api().then((res) => {
        console.log(res.data.user_name); // undefined
    });

    adapterApi().then((res) => {
        console.log(res.data.user_name); // undefined
    });
}
