/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

(function JoinSecuredNetworkPage(w) {
	
	var _page;
	var _title;
	var _form;
	var _passwordField;
	var _submitButton;
	var _pageData = {};
	var PAGE_ID = "#join_secured_network";
	
	var _self = this;
	
	$.mobile.document.on( "pageinit", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+" pageinit");
		_page = $(this);
		_title = _page.find("h3");
		_form = _page.find("form");
		_passwordField = _form.find("input[name=password]");
		_submitButton = _form.find("input[type=submit]");
		_form.submit(function(){
			console.log("JoinSecuredNetworkPage:submit");
			// ToDo: validation
			// http://www.raymondcamden.com/index.cfm/2012/7/30/Example-of-form-validation-in-a-jQuery-Mobile-Application
			
			var linkParams = _pageData;
			linkParams.password = _passwordField.val();
			var submitLink = _form.data("target");
			submitLink = d3d.util.replaceURLParameters(submitLink,_pageData);
			$.mobile.changePage(submitLink);
			return false;
		});
		// ToDo show password button?
		// http://unwrongest.com/projects/show-password/ 
		// http://trevordavis.net/blog/jquery-show-password-plugin
  });
	$.mobile.document.on( "pagebeforeshow", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+" pagebeforeshow");
		_pageData = d3d.util.getPageParams(PAGE_ID);
		console.log("  _pageData: ",_pageData);
		_title.text("Join "+_pageData.ssid);
		
  });
	$.mobile.document.on( "pagehide", PAGE_ID, function( event, data ) {
		console.log(PAGE_ID+" pagehide");
  });
})(window);