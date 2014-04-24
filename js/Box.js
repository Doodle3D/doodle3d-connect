/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var BoxPage = (function (w) {
	var _page;
	var _title;
	var _intro;
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
		_title = _page.find(".ui-title");
		_intro = _page.find(".intro");
		
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		console.log("Box page pagebeforeshow");
		_boxData = d3d.util.getPageParams(PAGE_ID);
		var boxURL = "http://"+_boxData.localip;
		console.log("  _boxData: ",_boxData);
		
		_title.text(_boxData.wifiboxid);
		_intro.text("");
		
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
			if(data.status !== "" && typeof data.status === 'string') {
				data.status = parseInt(data.status,10);
			}
			//console.log(_self.id,"NetworkPanel:retrievedStatus status: ",data.status,data.statusMessage);
			//console.log("  networkPanel ",_element[0]," parent: ",_element.parent()[0]);
			// ToDo: update _currentNetwork when available
			
			setNetworkStatus(data.status,data);
			
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
	function setNetworkStatus(status,data) {
		console.log("setNetworkStatus: ",status,data);
		if(status === NetworkAPI.STATUS.CONNECTED) { // online
			_page.find("#drawItem a").text("Draw");
			// ToDo: Link to update page (auto retrieve if available)
			// ToDo: Link to your app here? 
			// ToDo: Status
			// ToDo: Control
			_page.find("#joinNetworkItem").toggleClass("ui-screen-hidden",true);
			
		} else { // offline
			_intro.text("Please connect your WiFi-Box to the internet. You can also use it offline but then you aren't able to update.");
			
			var joinNetworkItem = _page.find("#joinNetworkItem");
			joinNetworkItem.toggleClass("ui-screen-hidden",false);
			
			var joinLink = joinNetworkItem.find("a").attr("href");
			joinLink = d3d.util.replaceURLParameters(joinLink,_boxData);
			joinNetworkItem.find("a").attr("href",joinLink);
			
			_page.find("#drawItem a").text("Draw (offline)");
			
			// ToDo: Status
			// ToDo: Control
		}
		
		// update info
		/*switch(status) {
			case NetworkAPI.STATUS.CONNECTED:
				//console.log("  data.ssid: ",data.ssid);
				if(data.ssid == "") {
					_currentNetwork = undefined;
					//data.status = NetworkAPI.STATUS.NOT_CONNECTED;
					setStatus(NetworkAPI.STATUS.NOT_CONNECTED);
				} else {
					_currentNetwork = data.ssid;
				}
				break;
			case NetworkAPI.STATUS.CONNECTING:
				if(_selectedNetwork != undefined) {
					targetNetwork = _selectedNetwork;
				} else if(_currentNetwork != undefined) {
					targetNetwork = _currentNetwork;
				}
			case NetworkAPI.STATUS.CREATING:
			case NetworkAPI.STATUS.CREATED:					
				_currentNetwork = undefined;
				break;
		}*/
		_networkStatus = data.status;
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