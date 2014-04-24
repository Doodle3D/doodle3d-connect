/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var BoxesPage = (function (w) {
	var connectAPI = new ConnectAPI(); // TODO add _
	
	var _page; 
	var _list;
	var _findItem;
	var PAGE_ID = "#boxes";
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		//console.log("Boxes page pageinit");
		_page = $(this);
		_list = _page.find("#boxeslist");
		_findItem = _list.find("#findItem");
		
		connectAPI.refreshing = onRefreshing;
		connectAPI.listUpdated = onListUpdated;
		connectAPI.boxAppeared = onBoxAppeared;
		connectAPI.boxDisapeared = onBoxDisapeared;
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		//console.log("Boxes page pagebeforeshow");
		connectAPI.start();
  });
	$.mobile.document.on( "pagehide", PAGE_ID, function( event, data ) {
		//console.log("Boxes page pagehide");
		connectAPI.stop();
  });
	
	function onRefreshing() {
		//console.log("onRefreshing");
		d3d.util.showLoader(true);
	}
	function onListUpdated(boxesData) {
		console.log("onListUpdated: ",boxesData);
		_list.append(_findItem); // make sure find is the last item
		_list.listview('refresh'); // jQuery mobile enhance content
	}
	function onBoxAppeared(boxData) {
		console.log("onBoxAppeared: ",boxData.localip);
		
		var link = "#box?localip="+boxData.localip+"&wifiboxid="+boxData.wifiboxid;
		if(boxData.link) { link += "&link="+boxData.link; }
		var id = boxData.localip.replace(/\./g,"-");
		var linkElement = $("<a href='"+link+"' class='link'>"+boxData.wifiboxid+"</a>");
		var box = $("<li id='"+id+"' class='box'></li>");
		box.append(linkElement);
		box.hide().appendTo(_list).fadeIn(500);
	}
	function onBoxDisapeared(boxData) {
		console.log("onBoxDisapeared: ",boxData.localip);
		
		var id = boxData.localip.replace(/\./g,"-");
		var box = _list.find("#"+id);
		console.log("  box: ",box);
		box.fadeOut(500,function() {
			box.remove();
			//_list.listview('refresh');
		});
	}
})(window);