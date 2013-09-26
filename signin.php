<?php
	
	if ($_SERVER['REQUEST_METHOD'] != "POST") return;
	
	require 'connect.php';
	
	if(!isset($_POST['localip'])) echo "missing localip </br>";
	$localip = $_POST['localip'];
	echo "localip: $localip </br>";
	
	if(!isset($_POST['wifiboxid'])) echo "missing wifiboxid </br>";
	$wifiboxid = $_POST['wifiboxid'];
	echo "wifiboxid: $wifiboxid </br>";
	
	$remoteip = getenv('REMOTE_ADDR');
	echo "remoteip: $remoteip </br>";
	
	$timestamp = time();
	echo "timestamp: $timestamp </br>";
	
	$id = $remoteip.'/'.$wifiboxid;
	echo "id: $id </br>";
	
	$statement = $db->prepare(	"REPLACE INTO $table " .
								"SET 	id = :id, " .
								"		remoteip = :remoteip, " .
								"		localip = :localip, " .
								"		wifiboxid = :wifiboxid, " .
								"		date = FROM_UNIXTIME(:timestamp)");
	$statement->execute(array(	':id' => $id,
								':remoteip' => $remoteip, 
								':localip' => $localip, 
								':wifiboxid' => $wifiboxid, 
								':timestamp' => $timestamp));
	
	// Remove old signins
	$hourago = time() - 60*60;
	echo "hourago: $hourago (time: ".time().")</br>";
	
	$statement = $db->prepare("DELETE FROM $table WHERE date < FROM_UNIXTIME(:hourago)");
	$statement->execute(array(		':hourago' => $hourago));	
?>
