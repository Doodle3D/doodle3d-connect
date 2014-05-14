/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

(function (w) {
	
	var _page;
	var _statusField;
	var _actionField;
	var _networkAPI = new NetworkAPI();
	var _connectAPI = new ConnectAPI();
	var _connectedBoxNetworkAPI = new NetworkAPI();
	var _infoAPI = new InfoAPI();
	var _pageData = {};
	var _formData;
	var _wifiboxid;
	var _wifiboxSSID;
	var _connectedChecking = false;
	
	var CONNECTED_REDIRECT_DELAY = 5000;
	var _connectedRedirectDelay;
	var BACKUP_REDIRECT_DELAY = 10*1000; // when the wifiboxid isn't retrievable we want to redirect anyway
	var _backupRedirectDelay;
	var PAGE_ID = "#connecting_to_network";
	
	var _self = this;
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+": pageinit");
		_page = $(this);
		_statusField = _page.find("#status");
		_actionField = _page.find("#action");
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+": pagebeforeshow");
		_pageData = d3d.util.getPageParams(PAGE_ID);
		var form = data.prevPage.find("form");
		// check if there are url params and a form from a prev page
		if(_pageData === undefined || form.length === 0) { 
			$.mobile.changePage("#boxes");
			return;
		}
		var boxURL = "http://"+_pageData.localip;
		_formData = d3d.util.getFormData(form);
		_infoAPI.init(boxURL);
		_networkAPI.init(boxURL);
		retrieveWiFiBoxID(function() {
			console.log("  _wifiboxid: ",_wifiboxid);
			console.log("  _wifiboxSSID: ",_wifiboxSSID);
			joinNetwork();
			_networkAPI.refreshing = onRefreshing;
			_networkAPI.updated = onStatusUpdated;
			_networkAPI.startAutoRefresh();
		});
  });
	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+": pagebeforehide");
		_networkAPI.stopAutoRefresh();
		_connectAPI.stop();
		_connectedBoxNetworkAPI.stopAutoRefresh();
		clearTimeout(_connectedRedirectDelay);
		clearTimeout(_backupRedirectDelay);
  });
	function retrieveWiFiBoxID(completeHandler) {
		console.log(PAGE_ID+":retrieveWiFiBoxID");
		_infoAPI.getInfo(function(infoData) {
			_wifiboxid = infoData.wifiboxid;
			_wifiboxSSID = infoData.substituted_ssid;
			completeHandler();
		},function() {
			_wifiboxid = undefined;
			_wifiboxSSID = undefined;
			// try connecting anyway (making sure wifiboxid retrieval isn't blocking)
			completeHandler();
		});
	}
	function joinNetwork() {
		console.log(PAGE_ID+":joinNetwork");
		_networkAPI.associate(_pageData.ssid,_formData.password,true);
		_connectedChecking = false;
	}
	function onRefreshing() {
		//console.log("ConnectingToNetworkPage:onRefreshing");
		d3d.util.showLoader(true);
	}
	function onStatusUpdated(data) {
		console.log("ConnectingToNetworkPage:onStatusUpdated");
		//console.log("  data: ",data);
		data.status = parseInt(data.status,10);
		console.log("  data.status: ",data.status);
		
		// update texts
		var statusText = "";
		var actionText = "";
		switch(data.status) {
			case NetworkAPI.STATUS.CONNECTING:
				statusText = "Connecting to "+_pageData.ssid+"...";
				//actionText = "Please reconnect yourself to <b>"+_pageData.ssid+"</b>. Once you are connected return to this page.";
				actionText = "Please reconnect yourself to <b>"+_pageData.ssid+"</b>. Once you are connected return to this page.";
				_actionField.attr("class","notice"); 
				break;
			case NetworkAPI.STATUS.CONNECTING_FAILED:
				statusText = "Could not connect...";
				actionText = "Please check password and try again";
				_actionField.attr("class","error");
				break;
			case NetworkAPI.STATUS.CONNECTED:
				statusText = "Connected to "+_pageData.ssid;
				actionText = "Please reconnect yourself to <b>"+_pageData.ssid+"</b>. Once you are connected return to this page.";
				_actionField.attr("class","notice"); 
				break;
			default:
				actionText = "Something went wrong, please try again";
				_actionField.attr("class","error");
				break;
		}
		// TODO ignore connected? 
		_statusField.html(statusText);
		_actionField.html(actionText);
		
		// When the box is connecting we start checking connect.doodle3d.com 
		// for a box with the same wifiboxid 
		if(data.status === NetworkAPI.STATUS.CONNECTING && !_connectedChecking) {
			if(_wifiboxid !== undefined || _wifiboxSSID !== undefined) {
				console.log("  start checking for same box");
				_connectAPI.boxAppeared = onBoxAppeared;
			} else {
				// if there is no wifiboxid or ssid available we'll check if we're online
				console.log("  start checking for internet");
				_connectAPI.listSuccess = onListSuccess;
			}
			_connectAPI.checkLocal = false;
			_connectAPI.start();
			_connectedChecking = true;
		}
	}
	function onBoxAppeared(boxData) {
		console.log(PAGE_ID+":onBoxAppeared: ",boxData.localip,boxData.wifiboxid);
		// if same box is found...
		if(_wifiboxid !== undefined && boxData.wifiboxid === _wifiboxid) {
			console.log("found _wifiboxid");
			checkBox(boxData);
		// wifiboxid of older firmware isn't available, fallback to ssid 
		} else if(_wifiboxSSID !== undefined){
			console.log("no _wifiboxid, falling back to _wifiboxSSID comparison");
			var connectedBoxConfigAPI = new ConfigAPI();
			connectedBoxConfigAPI.init("http://"+boxData.localip);
			connectedBoxConfigAPI.save({},function(saveResponseData) {
				if(saveResponseData.substituted_ssid === _wifiboxSSID) {
					checkBox(boxData);
				}
			});
		}
	}
	function checkBox(boxData) {
		// check if it finished connecting 
		var boxURL = "http://"+boxData.localip;
		_connectedBoxNetworkAPI = new NetworkAPI();
		_connectedBoxNetworkAPI.init(boxURL);
		_connectedBoxNetworkAPI.updated = function(data) {
			data.status = parseInt(data.status,10);
			console.log(PAGE_ID+":connectedBoxNetworkAPI:onStatusUpdated: ",data.status);
			// if box finished connecting
			if(data.status === NetworkAPI.STATUS.CONNECTED) {
				console.log("  found connected box");
				_statusField.html("Connected to "+_pageData.ssid);
				_actionField.html("Congratulations the box is connected to <b>"+_pageData.ssid+"</b>. You will be redirected in a moment...");
				_actionField.attr("class","info");
				// prevent status changes by wired box
				_networkAPI.stopAutoRefresh();
				
				_connectedRedirectDelay = setTimeout(function () {
					// redirect to it's box page
					console.log("  redirect to box");
					// replace this page with boxes page in history
					window.history.replaceState(null, "", "#boxes");
					var linkParams = {localip: boxData.localip,wifiboxid: boxData.wifiboxid};
					var link = "#box";
					link = d3d.util.replaceURLParameters(link,linkParams);
					$.mobile.changePage(link);
					_connectedBoxNetworkAPI.stopAutoRefresh();
					
					// disable warnings that are enabled on boxes page
					d3d.util.disableRefreshPrevention();
					d3d.util.disableLeaveWarning();
				},CONNECTED_REDIRECT_DELAY);
			}
		};
		_connectedBoxNetworkAPI.startAutoRefresh();
	}
	// when no wifiboxid or wifiboxSSID is available but we are online, we redirect to the boxes page 
	function onListSuccess() {
		console.log(PAGE_ID+":onListSuccess");
		_backupRedirectDelay = setTimeout(function () {
			$.mobile.changePage("#boxes");
		},BACKUP_REDIRECT_DELAY);
	}
})(window);