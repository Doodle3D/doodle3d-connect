/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
function ConnectAPI() {
	
	var _apiURL = "http://connect.doodle3d.com/api";
	var _timeoutTime = 3000;
	
	var _self = this;
	
	this.list = function(completeHandler,failedHandler) {
		//console.log("ConnectAPI:list");
		$.ajax({
			url: _apiURL + "/list.php",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("ConnectAPI:list response: ",response);
				if(response.status == "error" || response.status == "fail") {
					//console.log("ConnectAPI:list failed: ",response);
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			//console.log("ConnectAPI:list failed");
			if(failedHandler) failedHandler();
		});
	};
}