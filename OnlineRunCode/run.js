let shell = require("shelljs");
let code = `print('hello world')`;

let res = shell.exec(`python3 -c "${code}"`);
// res.stdout