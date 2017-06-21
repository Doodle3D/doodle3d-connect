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

	var _printerItem;
	var _infoAPI = new InfoAPI();
	var _networkAPI = new NetworkAPI();
	var _serverAPI = new ServerAPI();
	var _updateAPI = new UpdateAPI();
	var _configAPI = new ConfigAPI();
	var _printerAPI = new PrinterAPI();
	var _pageData = {};
	var _updateStatus = {};
	var _title;

	var _settings;

	var PAGE_ID = "#print";
	
	var _self = this;

	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+":pageinit");

		_page = $(this);
		_title = _page.find(".ui-title");

		$("#btnPrint").on("click", fetchPrint);
	});

	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		_pageData = d3d.util.getPageParams(PAGE_ID);
		
		console.log(_pageData);

		if(_pageData === undefined) { 
			console.log("ERROR",PAGE_ID,"_pageData undefined");
			$.mobile.changePage("#boxes");
			return;
		}
		var boxURL = "http://"+_pageData.localip;

		$("#lstPrint li.boxItem h2").text(_pageData.wifiboxid);
		$("#lstPrint li.gcodeItem h2").text("GCODE file");
		$("#lstPrint li.gcodeItem").attr("title",d3d.pageParams.uuid);

		_infoAPI.init(boxURL);
		_configAPI.init(boxURL);
		_networkAPI.init(boxURL);
		_printerAPI.init(boxURL);
		_serverAPI.init("https://gcodeserver.doodle3d.com");

		$("#lstPrint li.materialItem p").html(d3d.pageParams.uuid);

		_serverAPI.getInfo(d3d.pageParams.uuid, function(successData) {
			console.log("getInfo success",successData);
			$("#lstPrint li.gcodeItem p").text(d3d.util.formatBytes(successData["bytes"]));
			console.log(successData);


		},function(failData) {
			console.log("getInfo failed",failData);
			$("#lstPrint li.gcodeItem p").text("oops, '"+failData + "'");
		});

		_networkAPI.status(function(successData) {
			console.log("network status",successData);
			$("#lstPrint li.boxItem p").text(successData.statusMessage + " @ " + successData.ssid + "@ " + _pageData.localip);

		}, function(failData) {

		});
	
		_infoAPI.getStatus(function(successData) {
			$("#lstPrint li.printerItem p").text("Status: " + successData.state);
		},function(failData) {
			console.log("getStatus fail");
			d3d.util.hideLoader();
		});

		_configAPI.loadAll(function(successData) {
			_settings = successData;
			console.log(_settings);
			
			var printerLink = $("#lstPrint li.printerItem a").attr("href");
			printerLink = d3d.util.replaceURLParameters(printerLink,_pageData);
			$("#lstPrint li.printerItem a").attr("href",printerLink);

			var materialInfo = 
				_settings["printer.filamentThickness"] + "mm @ " +
				_settings["printer.temperature"] + " &deg;C";
			$("#lstPrint li.materialItem p").html(materialInfo);
			$("#lstPrint li.materialItem a").attr("href",printerLink);

			_printerAPI.listAll(function(successData) {
				console.log("printer listAll");
				var printerId = _settings["printer.type"];
				var printerName = successData[printerId];
				$("#lstPrint li.printerItem h2").text(printerName);
				$("#lstPrint li.printerItem img").attr('src','img/icons/printers/'+printerId+'.png');
			},function(failData) {
				console.log("printer listAll fail",failData);
			});

		},function(failData) {
			console.log(failData);
		});

	});

	$.mobile.document.on("pagebeforehide", PAGE_ID, function( event, data ) {

	});

	function fetchPrint() {
		var startcode = _configAPI.subsituteVariables(_settings["printer.startcode"],_settings);
		var endcode = _configAPI.subsituteVariables(_settings["printer.endcode"],_settings);

		var data = {
			"id": d3d.pageParams.uuid,
			"start_code": startcode,
			"end_code": endcode
		};

		console.log("fetchPrint",d3d.pageParams.uuid,data);
		_printerAPI.fetch(data,function(successData) {
			console.log("fetchPrint success",successData);

			var url = d3d.util.replaceURLParameters("#control",_pageData);
			$.mobile.changePage(url);

		},function(failData) {
			console.log("fetchPrint fail",failData);
			window.alert("Problem: " + failData.msg);
		});
	}


})(window);

