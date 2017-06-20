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

	function formatBytes(a,b) {
		if (0===a) {
			return "0 Bytes";
		} else {
			var c=1e3,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"];
			var f=Math.floor(Math.log(a)/Math.log(c));
			return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f];
		}
	}

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
			$("#lstPrint li.gcodeItem p").text(formatBytes(successData["bytes"]));
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
			var startcode = subsituteVariables(successData["printer.startcode"],successData);
			var endcode = subsituteVariables(successData["printer.endcode"],successData);

			var printerLink = $("#lstPrint li.printerItem a").attr("href");
			printerLink = d3d.util.replaceURLParameters(printerLink,_pageData);
			$("#lstPrint li.printerItem a").attr("href",printerLink);

			var materialInfo = 
				_settings["printer.filamentThickness"] + "mm @ " +
				_settings["printer.temperature"] + " &deg;C";
			$("#lstPrint li.materialItem p").html(materialInfo);
			$("#lstPrint li.materialItem a").attr("href",printerLink);

			$("#printStartgcode").val(startcode);
			$("#printEndgcode").val(endcode);

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

	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {

	});

	function fetchPrint() {
		console.log("fetchPrint",d3d.pageParams.uuid);
		_printerAPI.fetch({
			"id": d3d.pageParams.uuid,
			"startcode": $("#printStartgcode").val(),
			"endcode": $("#printEndgcode").val()
		},function(successData) {
			console.log("fetchPrint success",successData);
			$.mobile.changePage("#printing");
		},function(failData) {
			console.log("fetchPrint fail",failData);
		});
	}

	function subsituteVariables(gcode,settings) {
		//,temperature,bedTemperature,preheatTemperature,preheatBedTemperature
		var temperature = settings["printer.temperature"];
		var bedTemperature = settings["printer.bed.temperature"];
		var preheatTemperature = settings["printer.heatup.temperature"];
		var preheatBedTemperature = settings["printer.heatup.bed.temperature"];
		var printerType = settings["printer.type"];
		var heatedbed = settings["printer.heatedbed"];

		switch (printerType) {
			case "makerbot_replicator2": printerType = "r2"; break; 
			case "makerbot_replicator2x": printerType = "r2x"; break;
			case "makerbot_thingomatic": printerType = "t6"; break;
			case "makerbot_generic": printerType = "r2"; break;
			case "wanhao_duplicator4": printerType = "r2x"; break;
			case "_3Dison_plus": printerType = "r2"; break;
		}
		var heatedBedReplacement = (heatedbed)? "" : ";";

		gcode = gcode.replace(/{printingTemp}/gi ,temperature);
		gcode = gcode.replace(/{printingBedTemp}/gi ,bedTemperature);
		gcode = gcode.replace(/{preheatTemp}/gi ,preheatTemperature);
		gcode = gcode.replace(/{preheatBedTemp}/gi ,preheatBedTemperature);
		gcode = gcode.replace(/{printerType}/gi ,printerType);
		gcode = gcode.replace(/{if heatedBed}/gi ,heatedBedReplacement);

		return gcode;
	}

})(window);

