<?php
	require 'connect.php';
	
	$hourago = time() - 60*60;
	
	$remoteip = getenv('REMOTE_ADDR');
	
	$statement = $db->prepare("SELECT * FROM $table where date >= FROM_UNIXTIME(:hourago) AND remoteip = :remoteip");
	$statement->execute(array(	':hourago' => $hourago,
								':remoteip' => $remoteip));
	$boxes = $statement->fetchAll();
?>
<!DOCTYPE html>
<html>
<head>
  <title>Doodle3D Connect</title>

  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black" />
  <link rel="apple-touch-icon-precomposed" href="img/icon.png"/>
  <link rel="icon" type="image/ico" href="favicon.ico"/>
  <meta id="Viewport" name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=yes">

  <link href="css/normalize.css" rel="stylesheet" media="screen">
  <link href="css/main.css" rel="stylesheet" media="screen">
</head>
<body>
<p>Hi, we found the following Doodle3D WiFi boxes near you:</p>
<ul>
<?php
	foreach($boxes as $box) {
	    echo "<li><a href='http://".$box['localip']."' >".$box['wifiboxid']."</a></li>";
	}
?>
</ul>
</body>
</html>