/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

(function ConnectingToNetworkPage(w) {
	
	var _page;
	var _statusField;
	var _actionField;
	var _networkAPI = new NetworkAPI();
	var _connectAPI = new ConnectAPI();
	var _infoAPI = new InfoAPI();
	var _pageData = {};
	var _formData;
	var _wifiboxid;
	var _connectedChecking = false;
	
	var PAGE_ID = "#connecting_to_network";
	
	var _self = this;
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log("Connecting to network page pageinit");
		_page = $(this);
		_statusField = _page.find("#status");
		_actionField = _page.find("#action");
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		console.log("Connecting to network page pagebeforeshow");
		_pageData = d3d.util.getPageParams(PAGE_ID);
		var boxURL = "http://"+_pageData.localip;
		
		var form = data.prevPage.find("form");
		_formData = d3d.util.getFormData(form);
				
		_infoAPI.init(boxURL);
		_networkAPI.init(boxURL);
		retrieveWiFiBoxID(function() {
			joinNetwork();
			_networkAPI.refreshing = onRefreshing;
			_networkAPI.updated = onStatusUpdated;
			_networkAPI.startAutoRefresh();
		});
  });
	$.mobile.document.on( "pagehide", PAGE_ID, function( event, data ) {
		console.log("Connecting to network page pagehide");
		_networkAPI.stopAutoRefresh();
		_connectAPI.stop();
  });
	function retrieveWiFiBoxID(completeHandler) {
		console.log(PAGE_ID+":retrieveWiFiBoxID");
		_infoAPI.getInfo(function(infoData) {
			_wifiboxid = infoData.wifiboxid;
			console.log("  _wifiboxid: ",_wifiboxid);
			completeHandler();
		},function() {
			// try connecting anyway (making sure wifiboxid retrieval isn't blocking
			completeHandler();
		});
	}
	function joinNetwork() {
		console.log("joinNetwork");
		_networkAPI.associate(_pageData.ssid,_formData.password,true);
		_connectedChecking = false;
	}
	function onRefreshing() {
		//console.log("ConnectingToNetworkPage:onRefreshing");
		d3d.util.showLoader(true);
	}
	function onStatusUpdated(data) {
		console.log("ConnectingToNetworkPage:onStatusUpdated");
		console.log("  data: ",data);
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
		_statusField.html(statusText);
		_actionField.html(actionText);
		
		// When the box is connecting we start checking connect.doodle3d.com 
		// for a box with the same wifiboxid 
		if(data.status === NetworkAPI.STATUS.CONNECTING && !_connectedChecking && _wifiboxid !== undefined) {
			_connectAPI.boxAppeared = onBoxAppeared;
			_connectAPI.start();
			_connectedChecking = true;
		}
	}
	function onBoxAppeared(boxData) {
		console.log(PAGE_ID+":onBoxAppeared: ",boxData.localip,boxData.wifiboxid);
		// if same box is found...
		if(boxData.wifiboxid === _wifiboxid) {
			// check if it finished connecting 
			var boxURL = "http://"+boxData.localip;
			var connectedBoxNetworkAPI = new NetworkAPI();
			connectedBoxNetworkAPI.init(boxURL);
			connectedBoxNetworkAPI.updated = function(data) {
				data.status = parseInt(data.status,10);
				console.log(PAGE_ID+":connectedBoxNetworkAPI:onStatusUpdated: ",data.status);
				if(data.status === NetworkAPI.STATUS.CONNECTED) {
					// redirect to it's box page
					console.log("  redirect to box");
					var linkParams = {localip: boxData.localip,wifiboxid: boxData.wifiboxid};
					var link = "#box";
					link = d3d.util.replaceURLParameters(link,linkParams);
					$.mobile.changePage(link);
					connectedBoxNetworkAPI.stopAutoRefresh();
				}
			};
			connectedBoxNetworkAPI.startAutoRefresh();
		}
	}
})(window);