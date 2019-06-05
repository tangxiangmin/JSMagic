<?php

$context = $_POST['context'];
$chunks = (int)$_POST['chunks'];

$filename = './upload/' . $context . '/file.jpg'; //合并后的文件名  
for($i = 1; $i <= $chunks; ++$i){
    $file = './upload/'.$context. '/' .$i; // 读取单个切块
    $content = file_get_contents($file);
    if(!file_exists($filename)){
        $fd = fopen($filename, "w+");
    }else{
        $fd = fopen($filename, "a");
    }
    fwrite($fd, $content); // 将切块合并到一个文件上
}
echo $filename;

// echo $filename;