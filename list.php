<?php
	require 'connect.php';
	
	$hourago = time() - 60*60;
	$remoteip = getenv('REMOTE_ADDR');
	
	try {
		$statement = $db->prepare("SELECT * FROM $table where date >= FROM_UNIXTIME(:hourago) AND remoteip = :remoteip");
		$statement->execute(array(	':hourago' => $hourago,
									':remoteip' => $remoteip));
		$boxes = $statement->fetchAll();
	} catch (PDOException $e) {
		$response = array( 	"status" => "error",
							"msg" => $e->getMessage()." (".$e->getCode().")");
		exit(json_encode($response)."\r\n");
	}
	
	$debug = array(		"time" => time(),
						"hourago" => $hourago,
						"remoteip" => $remoteip);
	
	$response = array( 	"status" => "success",
						"data" => $boxes,
						"debug" => $debug);
	exit(json_encode($response)."\r\n");
?>