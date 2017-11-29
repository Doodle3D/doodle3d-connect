/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
function NetworkAPI() {
	
	NetworkAPI.STATUS = {
		CONNECTING_FAILED: -1,
		NOT_CONNECTED: 0,
		CONNECTING: 1,
		CONNECTED: 2,
		CREATING: 3,
		CREATED: 4
	};
	
	var _apiPath = "/d3dapi";
	var _apiCGIPath = "/cgi-bin"+_apiPath;
	
	var _wifiboxURL;
	var _wifiboxCGIBinURL;
	var _timeoutTime = 3000;
	
	var _networkStatus;
	var _networkSSID;
	
	var _associateTime;
	var _retrieveStatusDelayTime = 3000;
	var _autoRefreshing = false;
	var _refreshDelay;
	this.refreshDelayTime = 2000;
	//callbacks
	this.refreshing; 	// I'm refreshing
	this.updated; 		// New network status info
	
	var _self = this;

	this.init = function(wifiboxURL) {
		//console.log("NetworkAPI:init");
		//console.log("  wifiboxURL: ",wifiboxURL);
		//console.log("  wifiboxCGIBinURL: ",wifiboxCGIBinURL);
		_wifiboxURL = wifiboxURL+_apiPath;
		_wifiboxCGIBinURL = wifiboxURL+_apiCGIPath;
	}
	this.scan = function(completeHandler,failedHandler) {
		//console.log("NetworkAPI:scan");
		$.ajax({
			url: _wifiboxURL + "/network/scan",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:scan response: ",response);
				if(response.status == "error" || response.status == "fail") {
					//console.log("NetworkAPI:scan failed: ",response);
					if(failedHandler) failedHandler(response);
				} else {
					if (completeHandler) completeHandler(response.data);
				}
			}
		}).fail(function() {
			//console.log("NetworkAPI:scan failed");
			if(failedHandler) failedHandler();
		});
	};

	this.knownSSIDs = function(completeHandler,failedHandler) {
 		$.ajax({
 			url: _wifiboxURL + "/network/known",
 			type: "GET",
 			dataType: 'json',
 			timeout: _timeoutTime,
 			success: function(response){
console.log("knownSSIDs",response);

 				if (response.status == "error" || response.status == "fail") {
 					if (failedHandler) failedHandler(response);
 				} else {
 					if (completeHandler) completeHandler(response.data.networks.map(function(obj) {
 						return obj.ssid;
 					}));
 				}
 			}
 		}).fail(function() {
 			console.log("knownSSIDs fail");
 			if (failedHandler) failedHandler();
 		});
 	};
 

	this.status = function(completeHandler,failedHandler) {
		//console.log("NetworkAPI:status");
		// After switching wifi network or creating a access point we delay the actual status 
		// retrieval because the webserver needs time to switch it's status
		var now = new Date().getTime();
		if(now < _associateTime+_retrieveStatusDelayTime) {
			var data = {status: NetworkAPI.STATUS.CONNECTING};
			completeHandler(data);
		} else {
			$.ajax({
				url: _wifiboxURL + "/network/status",
				type: "GET",
				dataType: 'json',
				timeout: _timeoutTime,
				success: function(response){
					//console.log("NetworkAPI:status response: ",response);
					if(response.status == "error" || response.status == "fail") {
						if(failedHandler) failedHandler(response);
					} else {
						var data = response.data;
						// The WiFi-Box won't create a access point when it already is when booting, 
						// so when the status is empty it actually is a access point. 
						if(data.status === "") {
							data.status = NetworkAPI.STATUS.CREATED.toString();
						}
						completeHandler(response.data);
					}
				}
			}).fail(function() {
				if(failedHandler) failedHandler();
			});
		}
	};
	this.startAutoRefresh = function(delay,refreshingHandler,updatedHandler) {
		if(delay !== undefined) { _self.refreshDelayTime = delay; }
		if(refreshingHandler !== undefined) { _self.refreshing = refreshingHandler; }
		if(updatedHandler !== undefined) { _self.updated = updatedHandler; }
		_autoRefreshing = true;
		_self.refresh();
	}
	this.stopAutoRefresh = function() {
		_autoRefreshing = false;
		clearTimeout(_refreshDelay);
	}
	this.refresh = function() {
		//console.log("NetworkAPI:refresh");
		if(_self.refreshing) { _self.refreshing(); }
		_self.status(function(data) { // completed
			//console.log("NetworkAPI:refresh:completed");
			//console.log("  data: ",data);
			
			if(_self.updated !== undefined && 
				(_networkStatus !== data.status || _networkSSID !== data.ssid)) {
				_networkStatus = data.status;
				_networkSSID = data.ssid;
				_self.updated(data);
			}
			if(_autoRefreshing) {
				// keep refreshing
				clearTimeout(_refreshDelay);
				_refreshDelay = setTimeout(_self.refresh, _self.refreshDelayTime);
			}
		},function() { // failed
			if(_autoRefreshing) {
				// retry
				clearTimeout(_refreshDelay);
				_refreshDelay = setTimeout(_self.refresh, _self.refreshDelayTime);
			}
		});
	}	
	
	this.associate = function(ssid,phrase,recreate) {
		console.log("NetworkAPI:associate");
		console.log("  ssid: ",ssid);
		console.log("  recreate: ",recreate);
		if(phrase === undefined) { phrase = ""; }
		console.log("  phrase: ",phrase);
		var postData = {
				ssid:ssid,
				phrase:phrase
		};
		$.ajax({
			url: _wifiboxCGIBinURL + "/network/associate",
			type: "POST",
			data: postData,
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:associate response: ",response);
			}
		}).fail(function() {
			//console.log("NetworkAPI:associate: timeout (normal behavior)");
		});
		_associateTime = new Date().getTime();
	};
	
	this.openAP = function() {
		//console.log("NetworkAPI:openAP");
		$.ajax({
			url: _wifiboxCGIBinURL + "/network/openap",
			type: "POST",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:openAP response: ",response);
			}
		}).fail(function() {
			//console.log("NetworkAPI:openAP: timeout (normal behavior)");
		});
	};
	
	this.signin = function() {
		$.ajax({
			url: _wifiboxCGIBinURL + "/network/signin",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:signin response: ",response);
			}
		}).fail(function() {
			//console.log("NetworkAPI:signin: failed");
		});
	};
	
	this.alive = function(wifiboxURL,timeoutTime,successHandler,failedHandler, completeHandler) {
		if(wifiboxURL.indexOf("http://") != 0) {
			wifiboxURL = "http://" + wifiboxURL;
		}
		timeoutTime = (timeoutTime == -1)? _timeoutTime : timeoutTime;
		///console.log("NetworkAPI:alive: ",wifiboxURL);
		$.ajax({
			url: wifiboxURL + _apiPath + "/network/alive",
			type: "GET",
			dataType: 'json',
			timeout: timeoutTime,
			cache: false,
			success: function(response){
				//console.log("NetworkAPI:alive response: ",response);
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
					if(completeHandler) completeHandler(false, response);
				} else {
					successHandler(response.data);
					if(completeHandler) completeHandler(true, response.data);
				}
			}
		}).fail(function() {
			//console.log("NetworkAPI:alive failed");
			if(failedHandler) failedHandler();
			if(completeHandler) completeHandler(false);
		});
	};
}