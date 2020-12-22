function test1() {
    let themeModel = {
        name: "local_theme",
        get() {
            let val = localStorage.getItem(this.name);
            return val && JSON.parse(val);
        },
        set(val) {
            localStorage.setItem(this.name, JSON.stringify(val));
        },
        remove() {
            localStorage.removeItem(this.name);
        },
    };

    themeModel.get();
    themeModel.set(123);
}

function test2() {

    const storageMap = new Map()
    function createStorageModel(key, storage = localStorage) {
        // 相同key返回单例
        if (storageMap.has(key)) {
            return storageMap.get(key);
        }

        const model = {
            key,
            set(val, stringify = true) {
                if (stringify) {
                    val = JSON.stringify(val);
                }
                storage.setItem(this.key, val);
            },
            get(parse = true) {
                let val = storage.getItem(this.key);
                if (parse) {
                    try {
                        val = JSON.parse(val);
                    } catch (e) {
                        // console.log(e)
                    }
                }
                return val;
            },
            remove() {
                storage.removeItem(this.key);
            },
        };
        storageMap.set(key, model);
        return model;
    }

    const themeModel =  createStorageModel('local_theme', localStorage)
    const utmSourceModel = createStorageModel('utm_source', sessionStorage)
}
