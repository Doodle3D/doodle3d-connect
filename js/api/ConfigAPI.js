/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function ConfigAPI() {
	
	var _apiPath = "/d3dapi";
	var _apiCGIPath = "/cgi-bin"+_apiPath;
	var _wifiboxURL;
	var _wifiboxCGIBinURL;
	
	var _timeoutTime = 3000;
	var _saveSettingsTimeoutTime 	= 8000;
	
	var _self = this;

	this.init = function(wifiboxURL) {
		//console.log("ConfigAPI:init");
		
		_wifiboxURL = wifiboxURL+_apiPath;
		_wifiboxCGIBinURL = wifiboxURL+_apiCGIPath;
	}
	this.loadAll = function(completeHandler,failedHandler) {
		//console.log("ConfigAPI:loadAll");
		$.ajax({
			url: _wifiboxURL + "/config/all",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					if (failedHandler) failedHandler(response);
				} else {
					if (completeHandler) completeHandler(response.data);
				}
			}
		}).fail(function() {
			if (failedHandler) failedHandler();
		});
	};
	this.load = function(targetSettings,completeHandler,failedHandler) {
		//console.log("ConfigAPI:load");
		$.ajax({
			url: _wifiboxURL + "/config/",
			type: "GET",
			dataType: 'json',
			data: targetSettings,
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};

	this.loadSetting = function(settingName,completeHandler,failedHandler) {
		this.load(settingName+"=",function(successData) {
			completeHandler(successData[settingName]);
		},failedHandler);
	}
	
	this.loadPrinterType = function(completeHandler,failedHandler) {
		this.loadSetting("printer.type",completeHandler,failedHandler);
	}

	//this.loadStartOrEndGCode = function(startOrEndGCode, doSubstitute, completeHandler, failedHandler) {
	//	this.loadAll(function(successData) {
	//		var gcode = subsituteVariables(successData["printer."+startOrEndGCode],successData);
	//		if (completeHandler) completeHandler(gcode);
	//	},function(failedData) {
	//		if (failedHandler(failedData));
	//	});
	//}

	this.save = function(newSettings,completeHandler,failedHandler) {
		//console.log("ConfigAPI:save");
		$.ajax({
			url: _wifiboxCGIBinURL + "/config",
			type: "POST",
			data: newSettings,
			dataType: 'json',
			timeout: _saveSettingsTimeoutTime,
			success: function(response){
				//console.log("ConfigAPI:save response: ",response);
				if(response.status == "error" || response.status == "fail") {
					if (failedHandler) failedHandler(response);
				} else {
					console.log("ConfigAPI.save",newSettings,response.data);
					if (completeHandler) completeHandler(response.data);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};

	this.savePrinterType =  function(printerType,completeHandler,failedHandler) {
		var settings = {"printer.type": printerType};
		this.save(settings,completeHandler,failedHandler);
	};

	this.resetAll = function(completeHandler,failedHandler) {
		//console.log("ConfigAPI:resetAll");
		$.ajax({
			url: _wifiboxCGIBinURL + "/config/resetall",
			type: "POST",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};

	this.subsituteVariables = function(gcode,settings) {
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
}