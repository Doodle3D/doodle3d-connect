/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

(function (w) {
	var _page;
	var _statusField;
	var _descriptionField;
	
	var _updateAPI = new UpdateAPI();
	var _configAPI = new ConfigAPI();
	var _pageData = {};
	var _formData = {};
	var _installing = false;
	var UPDATED_REDIRECT_DELAY = 5000;
	var _updatedRedirectDelay;
	var _no_retain;
	var PAGE_ID = "#updating";
	
	var _self = this;
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		//console.log(PAGE_ID+":pageinit");
		_page = $(this);
		_statusField = _page.find("#status");
		_descriptionField = _page.find("#description");
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		//console.log(PAGE_ID+":pagebeforeshow");
		_pageData = d3d.util.getPageParams(PAGE_ID);
		var form = data.prevPage.find("form");
		// check if there are url params and 
		// a form from a prev page
		if(_pageData === undefined || 
			form.length === 0) { 
			$.mobile.changePage("#boxes");
			return;
		}
		_formData = d3d.util.getFormData(form);
		//console.log("  _formData: ",_formData);
		var boxURL = "http://"+_pageData.localip;
		_updateAPI.init(boxURL);
		_updateAPI.refreshing = onRefreshing;
		_updateAPI.updated = onStatusUpdated;
		
		downloadUpdate();
		_updateAPI.startAutoRefresh();
  });
	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {
		//console.log(PAGE_ID+":pagebeforehide");
		_updateAPI.stopAutoRefresh();
		clearTimeout(_updatedRedirectDelay);
  });
	
	
	function downloadUpdate() {
		//console.log(PAGE_ID+":downloadUpdate");
		_updateAPI.download();
	}
	function installUpdate() {
		//console.log(PAGE_ID+":installUpdate");
		//console.log("  _formData: ",_formData);
		_no_retain = (_formData.no_retain)? true : false;
		//console.log("  no_retain: ",_no_retain);
		_updateAPI.install(_no_retain);
		_installing = true;
	}
	
	
	function onRefreshing() {
		//console.log("ConnectingToNetworkPage:onRefreshing");
		d3d.util.showLoader(true);
	}
	function onStatusUpdated(data) {
		//console.log(PAGE_ID+": onStatusUpdated ");
		//console.log("  state_code: ",data.state_code," text: ",data.state_text);
		updatePage(data);
		
		switch(data.state_code) {
			case UpdateAPI.STATUS.IMAGE_READY: 
				if(!_installing) {
					installUpdate();
				}
				break;
			case UpdateAPI.STATUS.INSTALLED: 
				_installing = false;
				_updateAPI.stopAutoRefresh();
				clearTimeout(_updatedRedirectDelay);
				_updatedRedirectDelay = setTimeout(function () {
					if(_no_retain) {
						//console.log("  redirect to boxes");
						$.mobile.changePage("#boxes");
					} else {
						//console.log("  redirect to box");
						// replace this page with boxes page in history
						window.history.replaceState(null, "", "#boxes");
						var link = d3d.util.replaceURLParameters("#box",_pageData);
						$.mobile.changePage(link);
					}
				},UPDATED_REDIRECT_DELAY);
				break;
			case UpdateAPI.STATUS.INSTALL_FAILED:
				_installing = false;
				break;
		}
	}
	function updatePage(data) {
		console.log(PAGE_ID+": updatePage state: ",data.state_code);
		var status = "";
		switch(data.state_code){
			case UpdateAPI.STATUS.DOWNLOADING:
				status = "Downloading update...";
				break;
			case UpdateAPI.STATUS.DOWNLOAD_FAILED:
				status = "Downloading update failed";
				break;
			case UpdateAPI.STATUS.IMAGE_READY:
				status = "Update downloaded";
				break;
			case UpdateAPI.STATUS.INSTALLING:
				status = "Installing update... ";
				break;
			case UpdateAPI.STATUS.INSTALLED:
				status = "Update complete!";
				break;
			case UpdateAPI.STATUS.INSTALL_FAILED:
				status = "Installing update failed";
				break;
		}
		console.log("  status: ",status);
		_statusField.text(status);
		
		// description
		var description = "";
		switch(data.state_code){
			case UpdateAPI.STATUS.INSTALLING:
				description = "Do not remove power from the WiFi-Box.";
				if(_no_retain) {
					description += "<br/><small>Because you didn’t preserve your personal sketches and settings you will need to reconnect your WiFi-Box to your WiFi network. <br/>After an estimated update time you will be redirected to the boxes page. When it does, please connect your device to the WiFi network of the WiFi-Box and return to the boxes page. </small>";
				}
				break;
			case UpdateAPI.STATUS.DOWNLOAD_FAILED:
			case UpdateAPI.STATUS.INSTALL_FAILED:
				description = data.state_text;
				break;
		}
		console.log("  description: ",description);
		_descriptionField.html(description);
	}
	
})(window);