/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
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
	
	var _updateAPI = new UpdateAPI();
	var _configAPI = new ConfigAPI();
	var _printerAPI = new PrinterAPI();
	var _pageData = {};
	var _updateStatus = {};
	
	var PAGE_ID = "#settings";
	
	var _self = this;

	function updateFields() {
		var isHeatedBed = $("#chkBed").prop("checked");
		if (isHeatedBed) {
			$("#grpBedTemp").show(); 
		} else {
			$("#grpBedTemp").hide();
		}
	}

	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+":pageinit");

		_page = $(this);

		$("#divSettings").hide();
		d3d.util.showLoader();

		$("#chkBed").on("change", function(data) {
			updateFields();
		});

		$("#filamentThickness").on("change", function(data) {
			console.log("filamentThickness change",$(this).val());
		});

		$("#bedTemperature").on("change", function(data) {
			console.log("bedTemperature change",$(this).val());
		});
	});
	
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		_pageData = d3d.util.getPageParams(PAGE_ID);
		
		if(_pageData === undefined) { 
			console.log("ERROR",PAGE_ID,"_pageData undefined");
			$.mobile.changePage("#boxes");
			return;
		}
		var boxURL = "http://"+_pageData.localip;
		
		_configAPI.init(boxURL);
		_printerAPI.init(boxURL);


		_configAPI.loadAll(function(successData) {
			var printerType = successData["printer.type"];
			var printerStartGCode = successData["printer.startcode"];
			var printerEndGCode = successData["printer.endcode"];
			var heatedBedEnabled = successData["printer.heatedbed"];
			var bedTemperature = successData["printer.bed.temperature"];
			var dimensionsX = successData["printer.dimensions.x"];
			var dimensionsY = successData["printer.dimensions.y"];
			var dimensionsZ = successData["printer.dimensions.z"];
			var filamentThickness = successData["printer.filamentThickness"];
			var nozzleTemperature = successData["printer.temperature"];

			$('#chkBed').prop('checked', heatedBedEnabled);
			$('#chkBed').val('on').flipswitch('refresh');
			$('#bedTemperature').val(bedTemperature);
			$('#dimensionsX').val(dimensionsX);
			$('#dimensionsY').val(dimensionsY);
			$('#dimensionsZ').val(dimensionsZ);
			$('#filamentThickness').val(filamentThickness);
			$('#startgcode').val(printerStartGCode);
			$('#endgcode').val(printerEndGCode);
			$('#nozzleTemperature').val(nozzleTemperature);

			_printerAPI.listAll(function(printers) {
				console.log(PAGE_ID,'page init',data);
				
				$("#lstPrinters").empty();

				for (var id in printers) {
					var selected = (id===printerType) ? "selected " : "";
					$("#lstPrinters").append("<option "+selected+" value='"+id+"'>"+printers[id]+"</option>");
				}

				$("#lstPrinters").selectmenu("refresh", true);

				$("#divSettings").show();
				d3d.util.hideLoader();

			},function(failData) { //_printerAPI.listAll
				console.log(PAGE_ID,'FAIL _printerAPI.listall',data);
				$.mobile.changePage("#boxes");
				return;
			});

		},function(failData) {
			console.log("FAIL loadPrinterType",failData);
			$.mobile.changePage("#boxes");
			return;
		});
		
	});

	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {
	
	});

})(window);

