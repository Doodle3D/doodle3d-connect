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
	var _pageData = {};
	
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
		
		_networkAPI.init(boxURL);
		_networkAPI.refreshing = onRefreshing;
		_networkAPI.updated = onStatusUpdated;
		joinNetwork();
		_networkAPI.startAutoRefresh();
  });
	$.mobile.document.on( "pagehide", PAGE_ID, function( event, data ) {
		console.log("Connecting to network page pagehide");
		_networkAPI.stopAutoRefresh();
  });
	function joinNetwork() {
		console.log("joinNetwork");
		console.log("  _pageData.password: ",_pageData.password);
		_networkAPI.associate(_pageData.ssid,_pageData.password,true);		
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
				statusText = "Connecting to network ";
				actionText = "Please reconnect to <b>"+_pageData.ssid+"</b>. Once you are connected return to this page.";
				_actionField.attr("class","info");
				break;
			case NetworkAPI.STATUS.CONNECTING_FAILED:
				statusText = "Could not connect...";
				actionText = "Please check password and try again";
				_actionField.attr("class","error");
				break;
			case NetworkAPI.STATUS.CONNECTED:
				statusText = "Connected";
				actionText = "The WiFi-Box is connected to <b>"+_pageData.ssid+"</b>. <br/>Please reconnect to <b>"+_pageData.ssid+"</b>. Once you are connected return to this page.";
				_actionField.attr("class","info");
				break;
			default:
				actionText = "Something went wrong, please try again";
				_actionField.attr("class","error");
				break;
		}
		_statusField.html(statusText);
		_actionField.html(actionText);
		
		if(data.status === NetworkAPI.STATUS.CONNECTED) {
			_networkAPI.stopAutoRefresh();
		}
		
		// ToDo: attempt to auto redirect to connected WiFi-Box
		// attempt to retrieve connectAPI list, if same wifiboxid available (only works for version 0.10.2+), redirect to box page
	}
})(window);