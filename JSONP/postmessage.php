

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <script>
        var data = {code: 200, message: 'msg from backend'}
        window.parent && window.parent.postMessage(JSON.stringify(data), 'http://localhost:9999');
    </script>
</body>
</html>