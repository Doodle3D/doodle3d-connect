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
	//var _joinOtherItem;
	var _networks;
	var _networkAPI = new NetworkAPI();
	var _boxData = {};
	var _refreshDelay;
	var _knownSSIDs;
	var _refreshDelayTime = 3000;
	var PAGE_ID = "#join_network";
	
	var _self = this;
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log("Join network page pageinit");
		_page = $(this);
		_list = _page.find("ul[data-role=listview]");
		//_joinOtherItem = _list.find("#joinOther");
	});

	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		console.log("Join network page pagebeforeshow");
		_boxData = d3d.util.getPageParams(PAGE_ID);
		if(_boxData === undefined) { 
			$.mobile.changePage("#boxes");
			return;
		}
		var boxURL = "http://"+_boxData.localip;
		console.log("  _boxData: ",_boxData);
		
		_networkAPI.init(boxURL);

		_networkAPI.knownSSIDs(function(successData) {
			console.log("known",successData);
			_knownSSIDs = successData;
			refreshNetworks();
		},function(failData) {
			console.log("known networks fail");
		});

	});

	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {
		console.log("Join network page pagehide");
		clearTimeout(_refreshDelay);
	});

	function refreshNetworks() {
		//console.log("JoinNetwork:refreshNetworks");
		d3d.util.showLoader();
		_networkAPI.scan(function(data) { // completed
			// console.log("JoinNetwork:refreshNetworks:scanned");
			// console.log(data);
			d3d.util.hideLoader();
			_networks = {};
			$.each(data.networks, function(index,network) {
				network.known = _knownSSIDs.indexOf(network.ssid)>-1;
				_networks[network.ssid] = network;
			});
			// update list
			updateList();
			// keep refreshing
			clearTimeout(_refreshDelay);
			_refreshDelay = setTimeout(refreshNetworks, _refreshDelayTime);
		});
	}

	function updateList() {
		_list.empty();
		var baseConnectingLink = _list.data("connecting-target");
		var baseSecuredLink = _list.data("secured-target");
		var linkParams = $.extend({}, _boxData);
		//console.log("  linkParams: ",linkParams);
		// $.each(_networks, function(index,network) {
			//console.log("  network: ",network);

		var _ssids = $.map(_networks, function(obj) {
			return obj.ssid;
		});

		_ssids.sort(function(a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});

		// $.each(_ssids, function(ssid) {
		for (var i=0; i<_ssids.length; i++) {
			var ssid = _ssids[i];

			var network = _networks[ssid];

			linkParams.ssid = network.ssid;
			
			var secured = (network.encryption !== "none" && network.encryption !== "");
			var link;
			var icon = secured ? "lock" : "alert";
			linkParams.encryption = network.encryption;
			
			if (!secured || network.known) { //skip the password page
					link = d3d.util.replaceURLParameters(baseConnectingLink,linkParams);
			} else {
				link = d3d.util.replaceURLParameters(baseSecuredLink,linkParams);
			}

			var className = (network.known ? 'knownNetwork' : ''); //previously joined

			//console.log("  link: ",link);
			_list.append(
					// $('<li data-icon="'+icon+'"><a href="'+link+'">'+network.ssid+'</a></li>')
				$('<li class="'+className+'" data-icon="'+icon+'"><a href="'+link+'">'+network.ssid+'</a></li>')
			);
		}
		//_list.append(_joinOtherItem);
		_list.listview('refresh'); // jQuery mobile enhance content
	}

})(window);