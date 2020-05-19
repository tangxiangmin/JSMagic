function testSync() {
    function a() {
        throw "error b";
    }

    function b() {
        try {
            a();
        } catch (e) {
            if (e === "error b") {
                console.log("由b处理");
            } else {
                throw e;
            }
        }
    }

    try {
        b();
    } catch (e) {
        console.log("顶层catch");
    }
}

function testAsync() {
    function a(errorHandler) {
        let error = new Error("error a");
        if (errorHandler) {
            errorHandler(error);
        } else {
            throw error;
        }
    }

    function b(errorHandler) {
        let handler = e => {
            if (e === "error b") {
                console.log("由b处理");
            } else {
                errorHandler(e);
            }
        };

        setTimeout(() => {
            a(handler);
        });
    }

    let globalHandler = e => {
        console.log(e);
    };
    b(globalHandler);
}
