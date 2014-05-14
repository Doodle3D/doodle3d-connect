<?php
	require 'connect.php';
	
	$hourago = time() - 60*60;
	$remoteip = getenv('REMOTE_ADDR');
	
	try {
		$statement = $db->prepare("SELECT * FROM $table where date >= FROM_UNIXTIME(:hourago) AND remoteip = :remoteip");
		$statement->execute(array(	':hourago' => $hourago,
									':remoteip' => $remoteip));
		$boxes = $statement->fetchAll(PDO::FETCH_CLASS);
	} catch (PDOException $e) {
		$response = array( 	"status" => "error",
							"msg" => $e->getMessage()." (".$e->getCode().")");
		exit(json_encode($response)."\r\n");
	}
	
	$response = array( 	"status" => "success",
						"data" => $boxes);
	exit(json_encode($response)."\r\n");
?>