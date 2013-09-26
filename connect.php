<?php
	
	$database = "doodle3d_connect";
	$dsn = "mysql:host=localhost;dbname=$database";
	$username = "root";
	$password = "mysql";
	$table = "signins";
	
	$db = new PDO($dsn, $username, $password);
	$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	
?>
