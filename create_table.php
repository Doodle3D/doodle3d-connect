<?php

	require 'connect.php';
	
	// exported structure using phpMyAdmin
	$createsql = $db->prepare("CREATE TABLE IF NOT EXISTS $table (" .
			"`id` varchar(151) NOT NULL," .
			"`remoteip` varchar(15) NOT NULL," .
			"`localip` varchar(15) NOT NULL," .
			"`wifiboxid` varchar(140) NOT NULL," .
			"`hidden` tinyint(1) NOT NULL DEFAULT '0'," .
			"`date` datetime NOT NULL," .
			"PRIMARY KEY (`id`)" .
			") ENGINE=InnoDB DEFAULT CHARSET=latin1;");
	$createsql->execute();
?>
