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
	var _installing = false;
	var _ignoreNextStatusResponse = false;
	
	// When the updater doesn't preserve settings the box can't reconnect 
	// to the same network, so we can't retrieve whether the update was 
	// successfull, so we override the state to INSTALLED after a fixed delay
	var INSTALL_TIME = 90*1000; 
	var _installedDelayer; // setTimout instance
	
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
				if(_ignoreNextStatusResponse) {
					_ignoreNextStatusResponse = false;
					return;
				}
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
					if(_installing && data.state_code === UpdateAPI.STATUS.NONE) {
						data.state_code = UpdateAPI.STATUS.INSTALLED;
						_installing = false;
					}
					completeHandler(data);
				}
			}
		}).fail(function() {
			if(_ignoreNextStatusResponse) {
				_ignoreNextStatusResponse = false;
				return;
			}
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
					if(completeHandler) completeHandler(response.data);
				}
			}
		}).fail(function() {
			//console.log("UpdatePanel:downloadUpdate: failed");
			if(failedHandler) failedHandler();
		});
		overrideStatus(UpdateAPI.STATUS.DOWNLOADING);
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
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					var data = response.data;
					if(completeHandler) completeHandler(response.data);
				}
			}
		}).fail(function() {
			//console.log("UpdatePanel:installUpdate: no respons (there shouldn't be)");
		});
		overrideStatus(UpdateAPI.STATUS.INSTALLING);
		clearTimeout(_installedDelayer);
		if(noRetain) {
			_installedDelayer = setTimeout(function() {
				overrideStatus(UpdateAPI.STATUS.INSTALLED);
			},INSTALL_TIME);	
		}
		_installing = true;
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
	
	function overrideStatus(status) {
		_self.state = status;
		var data = {state_code:status,override:true};
		if(_self.updated) {
			_self.updated(data);
		}
		if(_autoRefreshing) {
			_ignoreNextStatusResponse = true;
			_self.refresh();
		}
	}
	
	function versionIsBeta(version) {
		return version ? /.*-.*/g.test(version) : null;
	}
	
}