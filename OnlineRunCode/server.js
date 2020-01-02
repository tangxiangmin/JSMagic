let express = require("express");
let app = express();
let fs = require("fs");

const { spawn } = require("child_process");

let http = require("http").createServer(app);
let io = require("socket.io")(http);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
    console.log("a user connected");
    try {
        socket.on("disconnect", function() {
            console.log("user disconnected");
        });
    
        // 运行传回的代码
        let subProcess;
        socket.on("run code", function(msg) {
            subProcess = runPython(socket, msg);
        });
    
        socket.on("code input", function(msg) {
            subProcess.stdin.write(msg + "\n");
        });
    }catch(e){
        console.log(e)
    }
    
});

http.listen(3000, function() {
    console.log("listening on *:3000");
});

function runPython(socket, code) {
    let fileName = "tmp.py"; // todo 换成随机文件名
    fs.writeFileSync(fileName, code, "utf8");

    // let subProcess = spawn("python3", ["input.py"], { cmd: __dirname });
    let subProcess = spawn("python3", [fileName], { cmd: __dirname });
    // let subProcess = spawn("python3", [`-c "${code}"`], { cmd: __dirname });

    let isClose = false;
    // 监听子进程是否运行完毕
    subProcess.on("close", code => {
        isClose = true;
        console.log(code === 0 ? "登录成功" : `子进程退出码：${code}`);
        subProcess.stdout.off("data", onData);
        subProcess.stderr.off("data", onData);
    });

    subProcess.stdout.on("data", onData);
    subProcess.stderr.on("data", onData);

    process.stdin.on("data", input => {
        input = input.toString().trim();
        if (!isClose) {
            subProcess.stdin.write(input + "\n");
        }
    });

    function onData(data) {
        setTimeout(() => {
            if (isClose) {
                socket.emit("code response", data.toString());
            } else {
                socket.emit("stdout", data.toString());
            }
        }, 20);
    }
    return subProcess;
}
