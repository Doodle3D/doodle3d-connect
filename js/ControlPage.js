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
	
	var PAGE_ID = "#control";
	
	var timerObject = {
		interval_id : null
	};

	var _self = this;

	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+":pageinit");

		_page = $(this);
		_title = _page.find(".ui-title");

		d3d.util.showLoader();

		$("#grpStatusAndControl").hide();

		$("#btnSend").on("click", function(data) {
			// console.log("test",$("#gcode").val());
			
			_configAPI.loadAll(function(successData) {
				_settings = successData;

				var gcode = _configAPI.subsituteVariables($("#gcode").val(),_settings);

				console.log("btnPrint subsituteVariables: ",gcode);

				$(this).hide();
				_printerAPI.print({
					gcode: gcode,
					start: true,
					first: true
				},function(successData) {
					console.log("btnSend success");
				},function(failData) {
					console.log("btnSend fail");
				});
			});
			
		});

		_pageData = d3d.util.getPageParams(PAGE_ID);
		
		// console.log(_pageData);

		if(_pageData === undefined) { 
			console.log("ERROR",PAGE_ID,"_pageData undefined");
			$.mobile.changePage("#boxes");
			return;
		}

		var backUrl = d3d.util.replaceURLParameters("#box",_pageData);
		$("#btnControlBack").attr("href",backUrl);

/*
		$("#btnCooldown").button().on("click", function(data) {
			_printerAPI.print({
				gcode: "M104 S20",
				start: true,
				first: true
			});
		});

		$("#btnHeatup").button().on("click", function(data) {
			_printerAPI.print({
				gcode: "M104 S180",
				start: true,
				first: true
			});
		});

		$("#btnHome").button().on("click", function(data) {
			_printerAPI.print({
				gcode: "G28",
				start: true,
				first: true
			});
		});
*/
		$("#btnStop").on("click", function(data) {
			if (!window.confirm("Are you sure you want to stop the current print?")) {
				return;
			}
			
			$(this).hide();

			_configAPI.loadAll(function(successData) {
				_settings = successData;

				var endcode = _configAPI.subsituteVariables(_settings["printer.endcode"],_settings);

				_printerAPI.stop({gcode:endcode}, function(successData) {
					console.log("btnStop success",successData);
					refreshStatus();
				},function(failData) {
					console.log("btnStop fail",failData);
					window.alert("Problem: " + failData.msg);
				});
			}, function(failData) {
				console.log('btnStop failed to load settings',failData);
			});

		});


	});

    function refreshStatus() {
		d3d.util.showLoader();

		_infoAPI.getStatus(function(successData) {
			$("#grpStatusAndControl").show();
			
			if (successData.state==="disconnected" || successData.state==="connecting") {
				$("#infoState").show();
				$("#infoState").text("Printer " + successData.state + "...");
				$("#grpStatusAndControl").hide();
			} else {
				$("#infoState").hide();
				$("#grpStatusAndControl").show();
				$("#infoNozzleTemperature").html(successData.hotend + " / " + successData.hotend_target + " &deg;C");
				$("#infoPrinterStatus").text(successData.state);
				// $("#infoBedTemperature").html(successData.bed + " / " + successData.bed_target + " &deg;C");
			}

			if (successData.state==="printing") {
				$("#liPrintingProgress").show();
				// console.log('printing',d3d.util.formatPercentage(successData.current_line,successData.total_lines));
				$("#infoPrintingProgress").text(d3d.util.formatPercentage(successData.current_line,successData.total_lines));
				$("#btnStop").show();
				// console.log('printing');
			} else {
				// console.log('not printing');
				$("#btnStop").hide();
				$("#liPrintingProgress").hide();
			}

			if (successData.state==="idle") {
				$("#grpCustomGCODE").show();
				$("#btnSend").show();
			} else {
				$("#grpCustomGCODE").hide();
			}
			
			// console.log("getStatus success",successData);
			d3d.util.hideLoader();

		},function(failData) {
			console.log("getStatus fail",failData);
			$("#grpStatusAndControl").hide();
			d3d.util.hideLoader();
		});
	}

	$.mobile.document.on("pagebeforeshow", PAGE_ID, function( event, data ) {
		_pageData = d3d.util.getPageParams(PAGE_ID);
		
		if(_pageData === undefined) { 
			console.log("ERROR",PAGE_ID,"_pageData undefined");
			$.mobile.changePage("#boxes");
			return;
		}
		var boxURL = "http://"+_pageData.localip;

		_title.text("Control 3D-printer on " + _pageData.wifiboxid);
		
		_configAPI.init(boxURL);
		_printerAPI.init(boxURL);
		_infoAPI.init(boxURL);

		// refreshSettings();

		timerObject.interval_id = setInterval(function() {refreshStatus(); }, 3000);    
	});

	$.mobile.document.on('pagehide', PAGE_ID, function(){   
		clearInterval(timerObject.interval_id);  
	}); 

	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {
		console.log("pagebeforehide");
	});

	
})(window);

