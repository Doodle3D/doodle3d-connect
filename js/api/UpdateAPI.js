/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
function UpdateAPI() {
	
	// states from api, see Doodle3D firmware src/script/d3d-updater.lua
	UpdateAPI.STATUS = {
		NONE: 					1, // default state
		DOWNLOADING: 		2,
		DOWNLOAD_FAILED:3,
		IMAGE_READY:		4, // download successful and checked
		INSTALLING:			5,
		INSTALLED:			6,
		INSTALL_FAILED:	7
	};
	var _apiPath = "/d3dapi";
	var _apiCGIPath = "/cgi-bin"+_apiPath;
	var _wifiboxURL;
	var _wifiboxCGIBinURL;
	var _timeoutTime = 3000;
	this.state; // update state from api
	this.stateText = ""; // update state text from api
	var _autoRefreshing = false;
	var _refreshDelay;
	this.refreshDelayTime = 2000;
	//callbacks
	this.refreshing; 	// I'm refreshing
	this.updated; 		// New network status info
	
	var _self = this;

	this.init = function(wifiboxURL) {
		_wifiboxURL = wifiboxURL+_apiPath;
		_wifiboxCGIBinURL = wifiboxURL+_apiCGIPath;
	}
	
	this.status = function(completeHandler,failedHandler) {
		//console.log("UpdateAPI:status");
		$.ajax({
			url: _wifiboxURL + "/update/status",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("UpdateAPI:status response: ",response);
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					var data = response.data;
					data.current_version_is_beta = versionIsBeta(data.current_version);
					data.newest_version_is_beta = versionIsBeta(data.newest_version);
					if(data.newest_release_date && data.current_release_date) {
						data.newest_version_is_newer = (data.newest_release_date - data.current_release_date > 0);
					} else {
						data.newest_version_is_newer = true;
					}
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	}
	this.download = function(completeHandler,failedHandler) {
		//console.log("UpdateAPI:download");
		$.ajax({
			url: _wifiboxURL + "/update/download",
			type: "POST",
			dataType: 'json',
			success: function(response){
				//console.log("UpdatePanel:downloadUpdate response: ",response);
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					var data = response.data;
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			//console.log("UpdatePanel:downloadUpdate: failed");
			if(failedHandler) failedHandler();
		});
	}
	this.install = function(noRetain, completeHandler,failedHandler) {
		//console.log("UpdateAPI:install");
		var postData = {no_retain:noRetain};
		$.ajax({
			url: _wifiboxURL + "/update/install",
			type: "POST",
			data: postData,
			dataType: 'json',
			success: function(response){
				//console.log("UpdatePanel:installUpdate response: ",response);
			}
		}).fail(function() {
			//console.log("UpdatePanel:installUpdate: no respons (there shouldn't be)");
		});
	}
	
	
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
		//console.log("UpdateAPI:refresh");
		if(_self.refreshing) { _self.refreshing(); }
		_self.status(function(data) { // completed
			//console.log("UpdateAPI:refresh:completed");
			
			if(_self.updated !== undefined && 
				 _self.state !== data.state_code) {
				_self.state = data.state_code;
				_self.updated(data);
			}
			if(_autoRefreshing) {
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
	
	function versionIsBeta(version) {
		return version ? /.*-.*/g.test(version) : null;
	}
	
}