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
	var _pageData = {};
	var _updateStatus = {};
	
	var PAGE_ID = "#update";
	
	var _self = this;
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		//console.log(PAGE_ID+":pageinit");
		_page = $(this);
		_statusField = _page.find("#status");
		_infoField = _page.find("#info");
		_form = _page.find("form");
		_noRetainCheckbox = _form.find("#noRetainConfiguration");
		_includeBetasCheckbox = _form.find("#includeBetas");
		_submitButton = _form.find("input[type=submit]");
		
		_noRetainCheckbox.change(noRetainCheckboxChanged);
		_includeBetasCheckbox.change(includeBetasChanged);
		_form.submit(update);
		
		// make sure links in (checkbox) labels are clickable
		_form.find("label a").click(function(event) {
			event.stopPropagation();
		});
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		//console.log(PAGE_ID+":pagebeforeshow");
		_pageData = d3d.util.getPageParams(PAGE_ID);
		if(_pageData === undefined) { 
			$.mobile.changePage("#boxes");
			return;
		}
		var boxURL = "http://"+_pageData.localip;
		
		_statusField.text("");
		_submitButton.button('disable');
		_submitButton.val("Update");
		_submitButton.button("refresh");
		_infoField.html("");
		
		_updateAPI.init(boxURL);
		retrieveUpdateStatus();
		_configAPI.init(boxURL);
  });
	$.mobile.document.on( "pagebeforehide", PAGE_ID, function( event, data ) {
		//console.log(PAGE_ID+":pagebeforehide");
  });
	
	function retrieveUpdateStatus() {
		console.log(PAGE_ID+":retrieveUpdateStatus");
		
		_submitButton.button('disable'); 
		
		_updateAPI.status(function(data) { // completed
			console.log(PAGE_ID+":retrieveUpdateStatus:completed");
			updatePage(data);
			_updateStatus = data;
		});
	}
	function updatePage(data) {
		// Status
		var status = "";
		switch(data.state_code){
			case UpdateAPI.STATUS.NONE:
				if(data.can_update) {
					status = "Update available";
				} else {
					status = "You're up to date.";
				}
				break;
			case UpdateAPI.STATUS.DOWNLOADING:
				status = "Downloading update...";
				break;
			case UpdateAPI.STATUS.DOWNLOAD_FAILED:
				status = "Downloading update failed.";
				break;
			case UpdateAPI.STATUS.IMAGE_READY:
				status = "Update downloaded.";
				break;
			case UpdateAPI.STATUS.INSTALLING:
				status = "Installing update... ";
				break;
			case UpdateAPI.STATUS.INSTALLED:
				status = "Update complete!";
				break;
			case UpdateAPI.STATUS.INSTALL_FAILED:
				status = "Installing update failed.";
				break;
		}
		_statusField.text(status);
		
		// Button
		updateButton(data);
		
		// Info
		var html = 'Current version: ' + data.current_version;
		if (data.current_release_date) {
			html += ' (released: ' + formatDate(data.current_release_date) + ')';
		}

		var localReleasenotes = "http://"+_pageData.localip+"/ReleaseNotes.html?"+data.current_version;
		html += ' (<a target="d3d-curr-relnotes" href="'+localReleasenotes+'">release notes</a>).';
		if(data.can_update) {
			html += '<br/>Latest version: ' + data.newest_version;
			if (data.newest_release_date) {
				html += ' (released: ' + formatDate(data.newest_release_date) + ')';
			}
			html += ' (<a target="d3d-new-relnotes" href="http://doodle3d.com/releasenotes/?'+data.newest_version+'">release notes</a>).';
		}
		_infoField.html(html);
	}
	function updateButton(data) {
		console.log(PAGE_ID+":updateButton");
		var noRetain = _noRetainCheckbox.prop('checked');
		
		var buttonText = "Update";
		_submitButton.button('disable');
		switch(data.state_code) {
			case UpdateAPI.STATUS.NONE:
			case UpdateAPI.STATUS.IMAGE_READY:
			case UpdateAPI.STATUS.DOWNLOAD_FAILED:
			case UpdateAPI.STATUS.INSTALL_FAILED:
				if(data.can_update || noRetain) {
					_submitButton.button('enable');
					if (data.newest_version_is_beta) {
						if(noRetain) {
							buttonText = "Clean update to beta";
						} else {
							buttonText = "Update to beta";
						}
					} else if (data.current_version_is_beta && !data.newest_version_is_newer) {
						if(noRetain) {
							buttonText = "Clean revert to latest stable release";
						} else {
							buttonText = "Revert to latest stable release";
						}
					} else if (noRetain){
						if(data.newest_version_is_newer) {
							buttonText = "Clean update";
						} else {
							buttonText = "Reinstall";
						}
					}
				}
				break;
		}
		_submitButton.val(buttonText);
		_submitButton.button("refresh");
	} 
	function formatDate(ts) {
		if (!ts || ts.length !== 8 || !/^[0-9]+$/.test(ts)) { return null; }
		var fields = [ ts.substr(0, 4), ts.substr(4, 2), ts.substr(6, 2) ];
		if (!fields || fields.length !== 3 || fields[1] > 12) { return null; }

		var abbrMonths = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
		return abbrMonths[fields[1] - 1] + " " + fields[2] + ", " + fields[0];
	}
	function noRetainCheckboxChanged () {
		//console.log(PAGE_ID+":noRetainCheckboxChanged");
		updateButton(_updateStatus);
	}
	function includeBetasChanged () {
		console.log(PAGE_ID+":includeBetasChanged");
		
		var settings = {};
		settings[_includeBetasCheckbox.attr('name')] = _includeBetasCheckbox.prop('checked');
		_configAPI.save(settings,function() {
			//console.log("  saved");
			retrieveUpdateStatus();
		});
	}
	
	function update() {
		console.log(PAGE_ID+":update");
		var submitLink = _form.data("target");
		submitLink = d3d.util.replaceURLParameters(submitLink,_pageData);
		$.mobile.changePage(submitLink);
		return false;
	}
	
})(window);