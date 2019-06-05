<?php

$context = $_POST['context'];
$path = './upload/' . $context;
if(!is_dir($path)){
    mkdir($path);
}
$filename = $path .'/'. $_POST['chunk'];
$res = move_uploaded_file($_FILES['file']['tmp_name'],$filename);
