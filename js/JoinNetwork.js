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
	var _networks;
//	var _networkStatus;
//	var _networkAPI = new NetworkAPI();
//	var _boxData = {};
//	var _retryRetrieveStatusDelay;
//	var _retryRetrieveStatusDelayTime = 3000;
	var PAGE_ID = "#join_network";
	
	var _self = this;
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log("Join network page pageinit");
		_page = $(this);
		_list = _page.find("ul[data-role=listview]");
		console.log("  list: ",_list);
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		console.log("Join network page pagebeforeshow");
		_boxData = d3d.util.getPageParams(PAGE_ID);
		var boxURL = "http://"+_boxData.localip;
		console.log("  _boxData: ",_boxData);
		
		_networkAPI.init(boxURL);
		refreshNetworks();
  });
	function refreshNetworks(completeHandler) {
		console.log("JoinNetwork:refreshNetworks");
		_api.scan(function(data) { // completed
			console.log("JoinNetwork:refreshNetworks:scanned");
			
			fillNetworks(data.networks)
			_networks = {};
			$.each(data.networks, function(index,network) {
				_networks[network.ssid] = network;
			});
			
			if(completeHandler) completeHandler();
		});
	}
	function fillNetworks(networks) {
		_list.empty();
		$.each(networks, function(index,network) {
			
			var joinLink = joinNetworkItem.find("a").attr("href");
			joinLink = d3d.util.replaceURLParameters(joinLink,_boxData);
			joinNetworkItem.find("a").attr("href",joinLink);
			
			
			var link = "#network_connecting";
			link = d3d.util.replaceURLParameters(link,_boxData);
			//var item = $("<li></li>");
			
			_list.append(
					//$("<option></option>").val(network.ssid).html(network.ssid)
			);
		});
		_list.listview('refresh'); // jQuery mobile enhance content
	}

})(window);