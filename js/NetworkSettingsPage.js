/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013-2017, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

(function (w) {
	var _page;
	var _form;
	var _statusField;
	var _infoField;
	var _noRetainCheckbox;
	var _includeBetasCheckbox;
	var _submitButton;
	var _settings;
	
	var _updateAPI = new UpdateAPI();
	var _configAPI = new ConfigAPI();
	var _printerAPI = new PrinterAPI();
	var _infoAPI = new InfoAPI();
	var _pageData = {};
	var _updateStatus = {};
	var _title;
	var endCode;
	
	var PAGE_ID = "#networksettings";
	
	var timerObject = {
		interval_id : null
	};

	var _self = this;

	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+":pageinit");

		_page = $(this);
		_title = _page.find(".ui-title");

		d3d.util.showLoader();

		_pageData = d3d.util.getPageParams(PAGE_ID);
		
		if(_pageData === undefined) { 
			console.log("ERROR",PAGE_ID,"_pageData undefined");
			$.mobile.changePage("#boxes");
			return;
		}


	});

    
	$.mobile.document.on("pagebeforeshow", PAGE_ID, function( event, data ) {
		_pageData = d3d.util.getPageParams(PAGE_ID);
		
		if(_pageData === undefined) { 
			console.log("ERROR",PAGE_ID,"_pageData undefined");
			$.mobile.changePage("#boxes");
			return;
		}
		var boxURL = "http://"+_pageData.localip;

		_title.text("Network Settings for " + _pageData.wifiboxid);
		
		_configAPI.init(boxURL);
		_printerAPI.init(boxURL);
		_infoAPI.init(boxURL);

	});

	$.mobile.document.on('pagehide', PAGE_ID, function(){   

	}); 

	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {

	});

	
})(window);

