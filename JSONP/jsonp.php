<?php

$callback_name = $_GET['callback'];

$data = "{code:200, message: 'ok', data: [1,2,3]}";
// 正常请求
// echo "$callback_name(" . $data  .")";

// xss
echo "$callback_name(" . $data  .", console.log('mock xss attack'))";

// 由于jsonp只支持get请求，因此也容易被诱导访问造成csrf攻击