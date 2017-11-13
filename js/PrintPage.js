/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013-2017, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

 (function (w) {
	
	var _serverAPI = new ServerAPI();
	var _connectAPI = new ConnectAPI();
	var _infoAPI = new InfoAPI();
	var _networkAPI = new NetworkAPI();
	var _printerAPI = new PrinterAPI();
	var _configAPI = new ConfigAPI();
	var _updateAPI = new UpdateAPI();
	var PAGE_ID = "#print";
	var _pageData = {};
	var _self = this;
	var _wifiboxSettings;
	var _slicerSettings;
	var timerId;


	$.mobile.document.on("pagebeforeshow", PAGE_ID, function( event, data ) {
		_pageData = d3d.util.getPageParams(PAGE_ID);

		if(_pageData === undefined) { 
			console.log("ERROR",PAGE_ID,"_pageData undefined");
			$.mobile.changePage("#boxes");
			return;
		}

		if (!d3d || !d3d.pageParams || !d3d.pageParams.uuid) {
			console.log("ERROR",PAGE_ID,"d3d.pageParams no uuid");
			$.mobile.changePage("#boxes");
			return;	
		}

		var boxURL = "http://"+_pageData.localip;

		//disabled by default
		$("#btnPrint").button().on("click", print);
		$("#btnPrint").button('disable');
		$("#pleaseUpgrade").hide();

		loadGCodeInfoFromServer(d3d.pageParams.uuid);

		_connectAPI.list(function(successData) {
			console.log("_connectAPI.list success",successData);
			$("#lstBoxes").empty();
			$("#lstBoxes").append($("<option></option>"));

			var selectedItem;
			for (var i in successData) {
				var box = successData[i];

				var selected = (box.localip===_pageData.localip) ? "selected " : "";
				if (selected) {
					selectedItem = _pageData.localip;
				}

				$("#lstBoxes").append($("<option "+selected+" value="+box.localip+">"+box.wifiboxid+"</option>"));
			}
			$("#lstBoxes").append($("<option value='other'>Other...</option>"));

			$("#lstBoxes").selectmenu("refresh", true);

			if (selectedItem) {
				onSelectWiFiBox(selectedItem);
			}

		}, function(failData) {
			console.log("_connectAPI.list failData",failData);
			$("#infoWiFiBox").html("<span class='error'>failed to retrieve list with local WiFi-Box'es</span>");
		});

		$("#lstBoxes").on("change", function(data) {
			var ip = $(this).val();
			console.log("lstBoxes change",ip);
			$("#infoWiFiBox").text("...");
			$("#pleaseUpgrade").hide();
			onSelectWiFiBox(ip);
		});

		timerId = setInterval(refreshWiFiBoxInfo,5000);

	});

	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {
		_connectAPI.stop();
		clearInterval(timerId);
	});

	function retrieveUpdateStatus() {
		
		
		_updateAPI.status(function(data) { // completed
			var canUpdate = data.can_update;
			
			if (canUpdate) {
				$("#pleaseUpgrade").show();
				$("#newest_version").text(" ("+data.newest_version+")");

				console.log("_pageData",_pageData);

				var updateLink = $("#pleaseUpgrade a").attr("href");
				updateLink = d3d.util.replaceURLParameters(updateLink,_pageData);
				$("#pleaseUpgrade a").attr("href",updateLink);
			}

		});
	}

	function onSelectWiFiBox(ip) {
		refreshWiFiBoxInfo(ip);		
	}

	function refreshWiFiBoxInfo(ip) {
		if (!ip) {
			ip = _pageData.localip;
			if (!ip) {
				return;
			}
		}

		$("#infoWiFiBox").show();

		if (!ip) {
			$("#btnPrint").button('disable');
			return;
		}
		else if (ip==="other") {
			// redirect
			$.mobile.changePage("#boxes");
		} else {

			// console.log("IP:",ip);

			var boxURL = "http://"+ip;
			_infoAPI.init(boxURL);
			_networkAPI.init(boxURL);
			_printerAPI.init(boxURL);
			_configAPI.init(boxURL);
			_updateAPI.init(boxURL);

			retrieveUpdateStatus();

			var localip = localStorage.setItem("localip",ip);

			_networkAPI.status(function(successData) {
				// console.log("network status",successData);
				// $("#lstPrint li.boxItem p").text(
				var netInfo = successData.statusMessage + " (" + successData.ssid + " @ <a href='http://" + successData.localip + "'>"+successData.localip+"</a>)";
				
				_infoAPI.getStatus(function(successData) {
					// console.log(successData);
					var state = successData.state;
					if (state==="idle") {
						state="ready";
						$("#btnPrint").button('enable');
					}

					_pageData.localip = ip; //update pageData to reflect the selected WiFi-Box without reloading the page
					var url = d3d.util.replaceURLParameters("#control",_pageData);
					var info = netInfo + " - Printer status: ";
					info += "<a href='"+url+"'><span class='"+state+"'>"+state+"</span></a>";
					$("#infoWiFiBox").html(info);
				}, function(failData) {
					console.log("_infoAPI.getStatus failData:",failData);
					$("#infoWiFiBox").html("<span class='error'>failed to retrieve <em>printer status</em> from WiFi-Box</span>");
				});


			}, function(failData) {
				console.log("_networkAPI status failed",failData);
				//this message is shown often which is confusing for the user.
				// $("#infoWiFiBox").html("<span class='error'>failed to retrieve <em>network status</em> from WiFi-Box</span>");
			});

		}
	}

	function checkPrinterTypeMatch(completeHandler, failedHandler) {
		_configAPI.loadAll(function(successData) {
			_wifiboxSettings = successData;

			var data = {
				slicerPrinterType: _slicerSettings.printer.type,
				wifiboxPrinterType: _wifiboxSettings["printer.type"]
			};

			if (data.slicerPrinterType === data.wifiboxPrinterType) {
				if (completeHandler) {
					completeHandler(data);
				}
			} else {
				if (failedHandler) {
					failedHandler(data);
				}
			}
		});
	}

	function forcePrinterTypeMatch(completeHandler, failedHandler) {

		checkPrinterTypeMatch(function(successData) {
			completeHandler({msg:"slicerPrinterType matches wifiboxPrinterType"});

		}, function(failData) {
			
			var override = window.confirm("The GCODE file was sliced for '"+failData.slicerPrinterType+"'.\n"+
				"Your WiFi-Box is currently configured for '"+failData.wifiboxPrinterType+"'\n\n"+
				"Do you want to override the settings on your WiFi-Box with the new settings from the slicer?");
			
			if (override) {
				_configAPI.savePrinterType(failData.slicerPrinterType, function(successData) {

					//reload settings from WiFi-Box with new printerType to get the right start & end gcode
					_configAPI.loadAll(function(successData) {
						_wifiboxSettings = successData;
						completeHandler({msg:"printer.type successfully updated and _wifiboxSettings successfully reloaded"});

					}, function(failData) {
						failedHandler({msg:"reload config failed"});
					});

				}, function(failData) {
					failedHandler({msg:"saving failed printer.type failed",details:failData});
				});
			} else {
				failedHandler({msg:""});
			}
		});

	}

	function print() {
		console.log("print");

		forcePrinterTypeMatch(function(successData) {
			console.log("successfully made sure printerType and config is up to date",successData);

			var startcode = _configAPI.subsituteVariables(_wifiboxSettings["printer.startcode"],_wifiboxSettings);
			var endcode = _configAPI.subsituteVariables(_wifiboxSettings["printer.endcode"],_wifiboxSettings);

			var data = {
				"id": d3d.pageParams.uuid,
				"start_code": startcode,
				"end_code": endcode
			};

			$("#btnPrint").button('disable');
			d3d.util.showLoader();

			//console.log("fetchPrint",d3d.pageParams.uuid,data);
			_printerAPI.fetch(data,function(successData) {
				console.log("fetchPrint success",successData);

				setTimeout(function() {
					var url = d3d.util.replaceURLParameters("#control",_pageData);
					$.mobile.changePage(url);
				},3000);

			},function(failData) {
				console.log("fetchPrint fail",failData);
				window.alert("Problem: " + failData.msg);
			});



		},function(failData) {
			window.alert("Sorry, the print can not be started because the settings don't match between the Slicer and the WiFi-Box.\n\nDetails: " + failData.msg);
		});
		

	}
		
	function clearInfo() {
		$("#infoFile").text("...");
		$("#infoPrinter").text("...");
		$("#infoMaterial").html("...");
		// $("#iconPrinter").attr('src','img/icons/blank.png');
	}

	function loadGCodeInfoFromServer(uuid) {
		_serverAPI.init("https://gcodeserver.doodle3d.com");

		_serverAPI.getInfo(uuid, function(successData) {
			console.log("getInfo success",successData);
			var filesize = d3d.util.formatBytes(successData["bytes"]);

			_serverAPI.fetchHeader(d3d.pageParams.uuid,function(successData) {
				console.log("_serverAPI fetchHeader success",successData);
				var header = successData;
				_slicerSettings = header; //copy header json data into _slicerSettings
				var printerId = header.printer.type;
				var printerTitle = header.printer.title;

				$("#infoFile").html("Filename: <b>" + header.name + " (" + filesize + ")</b>");
				$("#infoPrinter").html("Printer: <b>" + printerTitle + "</b>");
				$("#infoMaterial").html("Material: <b>" + header.filamentThickness + "mm @ " + header.temperature + "&deg;C</b>");
				// $("#iconPrinter").attr('src','img/icons/printers/'+printerId+'.png');
				
			}, function(failData) {
				console.log("_serverAPI.fetchHeader fail",failData);
				clearInfo();
			});


		},function(failData) {
			clearInfo();
			console.log("_serverAPI.getInfo fail",failData);
			setTimeout(function() {
				console.log("_serverAPI.getInfo: now try again",uuid);
				loadGCodeInfoFromServer(uuid);
			},3000);

		});

	}


})(window);
