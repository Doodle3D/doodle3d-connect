/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var BoxPage = (function (w) {
	var _page;
	var _list;
	var _title;
	var _intro;
	var _drawItem;
	var _updateItem;
	var _joinNetworkItem;
	
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
		
		_drawItem = _page.find("#drawItem");
		_updateItem = _page.find("#updateItem");
		_joinNetworkItem = _page.find("#joinNetworkItem");
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		console.log("Box page pagebeforeshow");
		_boxData = d3d.util.getPageParams(PAGE_ID);
		var boxURL = "http://"+_boxData.localip;
		console.log("  _boxData: ",_boxData);
		
		_title.text(_boxData.wifiboxid);
		setNetworkStatus(NetworkAPI.STATUS.CONNECTED);
		
		var drawLink = (_boxData.link)? _boxData.link : boxURL;
		_page.find("#drawItem a").attr("href",drawLink);
		
		_networkAPI.init(boxURL);
		retrieveNetworkStatus();
  });
	
	function retrieveNetworkStatus() {
		console.log("retrieveNetworkStatus");
		_networkAPI.status(function(data) {
			console.log("_networkAPI.status complete");
			console.log("  data: ",data);
			data.status = parseInt(data.status,10);
			console.log("  data.status: ",data.status);
			//console.log(_self.id,"NetworkPanel:retrievedStatus status: ",data.status,data.statusMessage);
			//console.log("  networkPanel ",_element[0]," parent: ",_element.parent()[0]);
			// ToDo: update _currentNetwork when available
			
			setNetworkStatus(data.status);
			
			/*// Keep checking for updates?
			switch(data.status) {
				case NetworkAPI.STATUS.CONNECTING:
				case NetworkAPI.STATUS.CREATING:
					clearTimeout(_retryRetrieveStatusDelay);
					_retryRetrieveStatusDelay = setTimeout(_self.retrieveStatus,_retryRetrieveStatusDelayTime); // retry after delay
					break;
			}*/
			//if(completeHandler) completeHandler(data.status);
		}, function() {
			//console.log("NetworkPanel:retrieveStatus failed");
			clearTimeout(_retryRetrieveStatusDelay);
			_retryRetrieveStatusDelay = setTimeout(_self.retrieveStatus, _retryRetrieveStatusDelayTime); // retry after delay
		});
	}
	
	function setNetworkStatus(status) {
		console.log("setNetworkStatus: ",status);
		console.log("  _updateItem: ",_updateItem);
		var introText = "";
		if(status === NetworkAPI.STATUS.CONNECTED) { // online
			console.log("online");
			_drawItem.find("a").text("Draw");
			// ToDo: Link to your app here? 
			// ToDo: Status
			// ToDo: Control
			_joinNetworkItem.toggleClass("ui-screen-hidden",true);
			_updateItem.toggleClass("ui-screen-hidden",false);
			// ToDo: retrieve update information
			
			_joinNetworkItem.toggleClass("ui-screen-hidden",true);
			
		} else { // offline
			console.log("offline");
			introText = "Please connect your WiFi-Box to the internet. You can also use it offline, but then you won't be able to update.";
			
			_joinNetworkItem.toggleClass("ui-screen-hidden",false);
			
			var joinLink = _joinNetworkItem.find("a").attr("href");
			joinLink = d3d.util.replaceURLParameters(joinLink,_boxData);
			_joinNetworkItem.find("a").attr("href",joinLink);
			
			_drawItem.find("a").text("Draw (offline)");
			_updateItem.toggleClass("ui-screen-hidden",true);
			
			// ToDo: Status
			// ToDo: Control
		}
		
		_intro.text(introText);
		_intro.toggleClass("ui-screen-hidden",(introText === ""));
		
		// ToDo: update footer with network info
		
		_list.listview('refresh'); // jQuery mobile enhance content
		_networkStatus = status;
	}
	
	// to get to the box data we need the url
	// only pagecontainer events contain url's
	/*$.mobile.document.on( "pagecontainerbeforetransition", function( event, data ) {
		//console.log("Box page pagebeforetransition");
		var url = d3d.util.processURL(data.absUrl);
		console.log("  url: ",url);
		if(url.hash == PAGE_ID) {
			_boxData = {
				localip: url.parameters.localip,
				wifiboxid: url.parameters.wifiboxid,
				link: url.parameters.link,
				url: "http://"+url.parameters.localip
			}
		}
  });*/
})(window);