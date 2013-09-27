<?php
	/*if ($_SERVER['REQUEST_METHOD'] != "POST") {
		$response = array( 	"status" => "error",
							"msg" => "'signin' can only be accessed with the POST method");
							
		
		exit(json_encode($response)."\r\n");
	}*/
	
	require 'connect.php';
	
	if(!isset($_GET['localip'])) {
		$response = array( 	"status" => "error",
							"msg" => "missing localip");
		exit(json_encode($response)."\r\n");
	}
	$localip = $_GET['localip'];
	
	if(!isset($_GET['wifiboxid'])) {
		$response = array( 	"status" => "error",
							"msg" => "missing wifiboxid");
		exit(json_encode($response)."\r\n");
	}
	$wifiboxid = $_GET['wifiboxid'];
	
	$remoteip = getenv('REMOTE_ADDR');
	
	$timestamp = time();
	
	$id = $remoteip.'/'.$wifiboxid;
	
	try {
		$statement = $db->prepare(	"REPLACE INTO $table " .
									"SET 	id = :id, " .
									"		remoteip = :remoteip, " .
									"		localip = :localip, " .
									"		wifiboxid = :wifiboxid, " .
									"		date = FROM_UNIXTIME(:timestamp)");
		$statement->execute(array(	":id" => $id,
									":remoteip" => $remoteip, 
									":localip" => $localip, 
									":wifiboxid" => $wifiboxid, 
									":timestamp" => $timestamp));
	} catch (PDOException $e) {
		$response = array( 	"status" => "error",
							"msg" => $e->getMessage()." (".$e->getCode().")");
		exit(json_encode($response)."\r\n");
	}
	
	$responseData = array( 	"remoteip" => $remoteip,
							"localip" => $localip,
							"wifiboxid" => $wifiboxid,
							"timestamp" => $timestamp);
	$response = array( 	"status" => "success",
						"data" => $responseData);
	exit(json_encode($response)."\r\n");
	
	// Remove old signins
	$hourago = time() - 60*60;
	try {
		$statement = $db->prepare("DELETE FROM $table WHERE date < FROM_UNIXTIME(:hourago)");
		$statement->execute(array(		':hourago' => $hourago));	
	} catch (PDOException $e) {
		$response = array( 	"status" => "error",
							"msg" => $e->getMessage()." (".$e->getCode().")");
		exit(json_encode($response)."\r\n");
	}
?>
