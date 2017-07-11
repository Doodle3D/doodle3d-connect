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
	// var _intro;
	var _drawItem;
	var _printItem;
	var _updateItem;
	var _settingsItem;
	var _controlItem;
	var _joinNetworkItem;
	var _defaultItems;
	
	var _networkStatus;
	var _networkAPI = new NetworkAPI();
	var _updateAPI = new UpdateAPI();
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
		// _intro = _page.find(".intro");
		
		_defaultItems = _list.children();
		_drawItem = _list.find("#drawItem");
		_updateItem = _list.find("#updateItem");
		_settingsItem = _list.find("#settingsItem");
		_controlItem = _list.find("#controlItem");
		_joinNetworkItem = _list.find("#joinNetworkItem");
		_printItem = _list.find("#printItem");

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
		
		//store the localip to be able to retrieve it in main.js when opening from Transform
		localStorage.setItem("localip",_boxData.localip); 

		_title.text(_boxData.wifiboxid);
		$(".infoWiFiBoxId").text(_boxData.wifiboxid);
		
		var drawLink = (_boxData.link)? _boxData.link : boxURL;
		_page.find("#drawItem a").attr("href",drawLink);
		
		$("#filemanagerItem a").attr("href",drawLink + "/filemanager");

		_networkAPI.init(boxURL);
		_updateAPI.init(boxURL);
		
		setNetworkStatus(NetworkAPI.STATUS.CONNECTED);
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
		// var introText = "";

		if(status === NetworkAPI.STATUS.CONNECTED) { // online
			//console.log("online");
			// _drawItem.find("h2").text("Draw / Sketch");
			
			// display the right buttons
			_defaultItems.toggleClass("ui-screen-hidden",false);
			_printItem.toggleClass("ui-screen-hidden",false);
			_joinNetworkItem.toggleClass("ui-screen-hidden",true);
			
			//update link
			var updateLink = _updateItem.find("a").attr("href");
			updateLink = d3d.util.replaceURLParameters(updateLink,_boxData);
			_updateItem.find("a").attr("href",updateLink);

			$("#collapsibleWiFiBox").collapsible("option", "collapsed",true);
			
			retrieveUpdateStatus();
			
		} else { // offline
			//console.log("offline");
			// introText = "Please connect your WiFi-Box to the internet. You can also use it offline, but then you won't be able to update.";
			
			// _drawItem.find("h2").text("Draw / Sketch (local)");
		
			// display the right buttons
			_defaultItems.toggleClass("ui-screen-hidden",true);
			_drawItem.toggleClass("ui-screen-hidden",false);
			_joinNetworkItem.toggleClass("ui-screen-hidden",false);

			$("#collapsibleWiFiBox").collapsible("option", "collapsed",false);
			// $("#collapsibleApps").collapsible("option", "collapsed",false);

			//joinLink
			var joinLink = _joinNetworkItem.find("a").attr("href");
			joinLink = d3d.util.replaceURLParameters(joinLink,_boxData);
			_joinNetworkItem.find("a").attr("href",joinLink);
		}
		
		// _intro.text(introText);
		// _intro.toggleClass("ui-screen-hidden",(introText === ""));
		
		//settingsLink
		var settingsLink = _settingsItem.find("a").attr("href");
		settingsLink = d3d.util.replaceURLParameters(settingsLink,_boxData);
		_settingsItem.find("a").attr("href",settingsLink);
		_settingsItem.toggleClass("ui-screen-hidden",false);

		//updateLink
		var controlLink = _controlItem.find("a").attr("href");
		controlLink = d3d.util.replaceURLParameters(controlLink,_boxData);
		_controlItem.find("a").attr("href",controlLink);
		_controlItem.toggleClass("ui-screen-hidden",false);
		
		//networkSettingsLink
		// var networksettingsLink = $("#networksettingsItem a").attr("href");
		// networksettingsLink = d3d.util.replaceURLParameters(networksettingsLink,_boxData);
		// $("#networksettingsItem a").attr("href",networksettingsLink);

		//printLink
		var printLink = _printItem.find("a").attr("href");
		printLink = d3d.util.replaceURLParameters(printLink,_boxData);
		_printItem.find("a").attr("href",printLink);

		
		if (d3d && d3d.pageParams && d3d.pageParams.uuid) {
			_printItem.show();
			$("#collapsiblePrinter").collapsible("option", "collapsed",false);
			// $( ".selector" ).collapsible( "option", "collapsed", false );

		} else {
			_printItem.hide();
		}

		// ToDo: update footer with network info
		
		_list.listview('refresh'); // jQuery mobile enhance content
		_networkStatus = status;
	}
	
	function retrieveUpdateStatus() {
		console.log(PAGE_ID+":retrieveUpdateStatus");
		var updateCounter = _list.find("#updateItem .ui-li-count");
		updateCounter.hide();
		_updateAPI.status(function(data) { // completed
			console.log("UpdateAPI:refresh:completed");
			var canUpdate = data.can_update;
			updateCounter.text(canUpdate? 1 : 0);
			updateCounter.show();
		});
	}
})(window);