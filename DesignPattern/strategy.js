function showError(msg) {
    console.log(msg);
}

function onFormSubmit(params) {
    if (!params.nickname) {
        return showError("请填写昵称");
    }
    if (params.nickname.length > 6) {
        return showError("昵称最多6位字符");
    }
    if (!/^1\d{10}$/.test(params.phone)) {
        return showError("请填写正确的手机号");
    }
    // ...

    sendSubmit(params);
}

class Schema {
    constructor(descriptor) {
        this.descriptor = descriptor;
    }

    handleRule(val, rule) {
        const { key, params, message } = rule;
        let ruleMap = {
            required() {
                return !val;
            },
            max() {
                return val > params;
            },
            validator() {
                return params(val);
            },
        };

        let handler = ruleMap[key];
        if (handler && handler()) {
            throw message;
        }
    }

    validate(data) {
        return new Promise((resolve, reject) => {
            let keys = Object.keys(data);
            let errors = [];
            for (let key of keys) {
                const ruleList = this.descriptor[key];
                if (!Array.isArray(ruleList) || !ruleList.length) continue;

                const val = data[key];
                for (let rule of ruleList) {
                    try {
                        this.handleRule(val, rule);
                    } catch (e) {
                        errors.push(e.toString());
                    }
                }
            }
            if (errors.length) {
                reject(errors);
            } else {
                resolve();
            }
        });
    }
}

const descriptor = {
    nickname: [
        { key: "required", message: "请填写昵称" },
        { key: "max", params: 6, message: "昵称最多6位字符" },
    ],
    phone: [
        { key: "required", message: "请填写电话号码" },
        {
            key: "validator",
            params(val) {
                return !/^1\d{10}$/.test(val);
            },
            message: "请填写正确的电话号码",
        },
    ],
};

const validator = new Schema(descriptor);

const params = { nickname: "", phone: 123 };
validator
    .validate(params)
    .then(() => {
        console.log("success");
    })
    .catch((e) => {
        console.log(e);
    });
