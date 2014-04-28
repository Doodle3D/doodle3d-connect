/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function InfoAPI() {
	
	var _apiPath = "/d3dapi";
	var _apiCGIPath = "/cgi-bin"+_apiPath;
	var _wifiboxURL;
	var _wifiboxCGIBinURL;
	
	var _timeoutTime 							= 3000;
	
	var _configAPI = new ConfigAPI(); // needed for wifiboxid workaround
	
	var _self = this;

	this.init = function(wifiboxURL) {
		console.log("InfoAPI:init");
		
		_wifiboxURL = wifiboxURL+_apiPath;
		_wifiboxCGIBinURL = wifiboxURL+_apiCGIPath;
		_configAPI.init(wifiboxURL);
	}
	this.getInfo = function(completeHandler,failedHandler) {
		$.ajax({
			url: _wifiboxURL + "/info",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					var infoData = response.data;
					
					// Versions older than 0.10.2 don't include wifiboxid in info response 
					// so we use a workaround (saving to config)
					if(infoData.wifiboxid === undefined) {
						_configAPI.save({},function(saveResponseData) {
							infoData.wifiboxid = saveResponseData.substituted_wifiboxid;
							completeHandler(infoData);
						},function() {
							failedHandler();
						});
					} else {
						completeHandler(infoData);
					}
					
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};
}