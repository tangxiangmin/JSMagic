const browserConsole = window.console;

function printInConsolePanel(type, msg) {
    const dom = document.querySelector("J_erdua_console_panel")
    dom.innerHTML = type + ":" + msg
}

const erduaConsole = {
    browserConsole,
    log(msg) {
        // 打印在真实面板上
        printInConsolePanel("log", msg);
        // 原本的浏览器log
        this.browserConsole.log(msg);
    },
};

window.console = {
    ...browserConsole,
    ...erduaConsole,
};
