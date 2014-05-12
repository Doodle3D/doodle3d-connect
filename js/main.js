/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var d3d = {};
d3d.util = {
	// Helper function that splits a URL just the way we want it
	parseURL:function(url) {
		var parsed = $.mobile.path.parseUrl( url );
		var hashParts = parsed.hash.split( "?" );
		var parameters;
			// Assemble query parameters object from the query string
		if (hashParts.length > 1) {
			parameters = {};
			jQuery.each(hashParts[1].split( "&" ), function( index, value ) {
				var pair = value.split( "=" );
				if ( pair.length > 0 && pair[ 0 ] ) {
					parameters[ pair[ 0 ] ] =
						( pair.length > 1 ? decodeURIComponent(pair[ 1 ]) : true );
				}
			});
		}
		return {
				parsed: parsed,
				hash: ( hashParts.length > 0 ? hashParts[ 0 ] : "" ),
				parameters: parameters
		};
	},
	getPageParams:function(pageID) {
		return d3d.pageParams[pageID];
	},
	replaceURLParameters:function(href,parameters){
		href = href.split("?")[0];
		var i = 0;
		jQuery.each(parameters, function (key,value) {
			value = encodeURIComponent(value);
			href += (i===0)? "?" : "&";
			href += key+"="+value;
			i++;
		});
		return href;
	},
	showLoader:function(autoHide) {
		setTimeout(function(){
			var loader = $.mobile.loading('show'); //.addClass("fadePrepare");
			loader.addClass("fadeIn");
			/*setTimeout(function() {
				loader.addClass("fadeIn");
			},500);*/
			if(autoHide) {
				setTimeout(function() {
					$.mobile.loading('hide');
				},1000);
			}
		}, 1); 
	},
	hideLoader:function() {
		$.mobile.loading('hide');
	},
	getFormData:function(form) {
		var formData = {};
		jQuery.each(form.serializeArray(), function(index,field) {
			formData[field['name']] = field['value']; 
		});
		return formData;
	},
	enableRefreshPrevention:function() {
		$(document).on("keydown",d3d.util.preventRefresh);
	},
	disableRefreshPrevention:function() {
		$(document).off("keydown",d3d.util.preventRefresh);
	},
	preventRefresh:function(event) {
		if((event.which === 82 && (event.ctrlKey || event.metaKey)) || // ctrl+r
				event.which === 116) { // F5
			event.preventDefault();
			event.stopImmediatePropagation();
			return false;
		}
	},
	disableLeaveWarning:function() {
		window.onbeforeunload = null;
	},
	enableLeaveWarning:function(warning) {
		if(warning === undefined) {
			warning = "Are you sure you want to leave?";
		}
		window.onbeforeunload = function() {
			return warning;
		};
	},
	autofocus:function(form) {
		if (!("autofocus" in document.createElement("input"))) {
			var target = form.find("input[autofocus]:visible");
			target.focus();
    }
	}
};

(function (w) {
	// To get to url parameters we need the url
	// only pagecontainer events contain url's
	// we parse the parameters and store them in a global object
	$.mobile.document.on( "pagebeforechange", function( event, data ) {
		if (typeof data.toPage !== "string") { return; }
		var url = d3d.util.parseURL(data.toPage);
		if(url.parameters === undefined) { return; }
		if(!d3d.pageParams) { d3d.pageParams = {}; }
		d3d.pageParams[url.hash] = url.parameters;
		
		// let jQuery mobile navigate to page (providing only the page id so it understands)
		$.mobile.changePage(url.hash, data.options);
		// replace the history item with a url including parameters
		window.history.replaceState(null, null, url.parsed.href);
		// make sure that the parameters are not removed from the visible url
		event.preventDefault();
	});
})(window);