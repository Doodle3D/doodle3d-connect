<?php
	
	$database = "doodle3d_connect";
	$dsn = "mysql:host=localhost;dbname=$database";
	$username = "root";
	$password = "mysql";
	$table = "signins";
	
	try {
		$db = new PDO($dsn, $username, $password);
		$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	} catch (PDOException $e) {
		$response = array( 	"status" => "error",
							"msg" => $e->getMessage()." (".$e->getCode().")");
		exit(json_encode($response)."\r\n");
	}
?>
