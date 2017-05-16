/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function PrinterAPI() {
	
	var _apiPath = "/d3dapi";
	var _apiCGIPath = "/cgi-bin"+_apiPath;
	var _wifiboxURL;
	var _wifiboxCGIBinURL;
	
	var _timeoutTime = 3000;
	
	var _configAPI = new ConfigAPI(); // needed for wifiboxid workaround
	
	var _self = this;

	this.init = function(wifiboxURL) {
		console.log("InfoAPI:init");
		
		_wifiboxURL = wifiboxURL+_apiPath;
		_wifiboxCGIBinURL = wifiboxURL+_apiCGIPath;
		_configAPI.init(wifiboxURL);
	}

	this.listAll = function(completeHandler,failedHandler) {
		console.log("listAll",_wifiboxURL);

		$.ajax({
			url: _wifiboxURL + "/printer/listall",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data.printers);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};
}