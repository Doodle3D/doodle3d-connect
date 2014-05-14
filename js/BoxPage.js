/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

(function (w) {
	var _page;
	var _list;
	var _title;
	var _intro;
	var _drawItem;
	//var _updateItem;
	var _joinNetworkItem;
	var _defaultItems;
	
	var _networkStatus;
	var _networkAPI = new NetworkAPI();
	var _boxData = {};
	var _retryRetrieveStatusDelay;
	var _retryRetrieveStatusDelayTime = 3000;
	var PAGE_ID = "#box";
	
	var _self = this;
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		//console.log("Box page pageinit");
		_page = $(this);
		_list = _page.find("ul[data-role=listview]");
		_title = _page.find(".ui-title");
		_intro = _page.find(".intro");
		
		_defaultItems = _list.children();
		_drawItem = _list.find("#drawItem");
		//_updateItem = _list.find("#updateItem");
		_joinNetworkItem = _list.find("#joinNetworkItem");
		
		// make sure draw link is opened in same WebApp (added to homescreen) 
		// and it doesn't start a browser
		$.stayInWebApp("#box #drawItem a",true);
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		console.log("Box page pagebeforeshow");
		_boxData = d3d.util.getPageParams(PAGE_ID);
		if(_boxData === undefined) { 
			$.mobile.changePage("#boxes");
			return;
		}
		var boxURL = "http://"+_boxData.localip;
		//console.log("  _boxData: ",_boxData);
		
		_title.text(_boxData.wifiboxid);
		setNetworkStatus(NetworkAPI.STATUS.CONNECTED);
		
		var drawLink = (_boxData.link)? _boxData.link : boxURL;
		_page.find("#drawItem a").attr("href",drawLink);
		
		_networkAPI.init(boxURL);
		retrieveNetworkStatus();
  });
	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {
		clearTimeout(_retryRetrieveStatusDelay);
  });
	
	
	function retrieveNetworkStatus() {
		_networkAPI.status(function(data) {
			data.status = parseInt(data.status,10);
			setNetworkStatus(data.status);
		}, function() {
			clearTimeout(_retryRetrieveStatusDelay);
			_retryRetrieveStatusDelay = setTimeout(_self.retrieveStatus, _retryRetrieveStatusDelayTime); // retry after delay
		});
	}
	
	function setNetworkStatus(status) {
		console.log(PAGE_ID+":setNetworkStatus: ",status);
		var introText = "";
		if(status === NetworkAPI.STATUS.CONNECTED) { // online
			//console.log("online");
			_drawItem.find("a").text("Draw");
			
			// display the right buttons
			_defaultItems.toggleClass("ui-screen-hidden",false);
			_joinNetworkItem.toggleClass("ui-screen-hidden",true);
			// ToDo: retrieve update information
			
		} else { // offline
			//console.log("offline");
			introText = "Please connect your WiFi-Box to the internet. You can also use it offline, but then you won't be able to update.";
			
			_drawItem.find("a").text("Draw (offline)");
			
			// display the right buttons
			_defaultItems.toggleClass("ui-screen-hidden",true);
			_drawItem.toggleClass("ui-screen-hidden",false);
			_joinNetworkItem.toggleClass("ui-screen-hidden",false);
			
			var joinLink = _joinNetworkItem.find("a").attr("href");
			joinLink = d3d.util.replaceURLParameters(joinLink,_boxData);
			_joinNetworkItem.find("a").attr("href",joinLink);
		}
		
		_intro.text(introText);
		_intro.toggleClass("ui-screen-hidden",(introText === ""));
		
		// ToDo: update footer with network info
		
		_list.listview('refresh'); // jQuery mobile enhance content
		_networkStatus = status;
	}
})(window);