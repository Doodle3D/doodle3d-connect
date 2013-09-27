<?php
	
	if ($_SERVER['REQUEST_METHOD'] != "POST") {
		$response = array( 	"status" => "error",
							"msg" => "'signin' can only be accessed with the POST method");
		exit(json_encode($response));
	}
	
	require 'connect.php';
	
	if(!isset($_POST['localip'])) echo "missing localip </br>";
	$localip = $_POST['localip'];
	
	if(!isset($_POST['wifiboxid'])) echo "missing wifiboxid </br>";
	$wifiboxid = $_POST['wifiboxid'];
	
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
		exit(json_encode($response));
	}
	
	$responseData = array( 	"remoteip" => $remoteip,
							"localip" => $localip,
							"wifiboxid" => $wifiboxid,
							"timestamp" => $timestamp);
	$response = array( 	"status" => "success",
						"data" => $responseData);
	exit(json_encode($response));
	
	// Remove old signins
	$hourago = time() - 60*60;
	try {
		$statement = $db->prepare("DELETE FROM $table WHERE date < FROM_UNIXTIME(:hourago)");
		$statement->execute(array(		':hourago' => $hourago));	
	} catch (PDOException $e) {
		$response = array( 	"status" => "error",
							"msg" => $e->getMessage()." (".$e->getCode().")");
		exit(json_encode($response));
	}
?>
