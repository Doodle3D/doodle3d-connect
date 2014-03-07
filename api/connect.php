<?php
	
	header("Access-Control-Allow-Origin: *");
	header("Content-type: application/json");
	
	require 'credentials.php';
	
	$database = "doodle3d_connect";
	$dsn = "mysql:host=localhost;dbname=$database";
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
