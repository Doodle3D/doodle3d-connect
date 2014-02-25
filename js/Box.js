/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
function Box() {
	
	this.localip;
	this.wifiboxid;
	this.connecting = false;
	this.destroyedHandler;
	
	var _element;
	var _networkPanel;
	var _delayedDestroy;
	var _self = this;

	this.init = function(boxData,parentElement) {
		
		_self.localip = boxData.localip;
		_self.wifiboxid = boxData.wifiboxid;
		var url = "http://"+_self.localip;
		
		// create box dom element
		var link = (boxData.link)? boxData.link : url;
		_element = $("<li id='"+_self.localip+"' class='box'></li>");
		_element.append("<a href='"+link+"' class='link'>"+_self.wifiboxid+"</a>");
		_element.hide().appendTo(parentElement).fadeIn(500);
		
		// create network panel dom element
		var networkPanelElement = $("#networkForm").clone();
		networkPanelElement.addClass(networkPanelElement.attr("id"));
		networkPanelElement.removeAttr("id");
		_element.append(networkPanelElement);
		
		// create network panel
		_networkPanel = new NetworkPanel();
		_networkPanel.id = _self.localip;
		_networkPanel.init(url,networkPanelElement, networkStatusChangeHandler);
		
	}
	function networkStatusChangeHandler(networkStatus) {
		console.log("Box:networkStatusChangeHandler: ",networkStatus);
		_self.connecting = (networkStatus == NetworkAPI.STATUS.CONNECTING);
		
		// because openwrt can be slow to update it's ssid, a box might 
		// report it failed connecting but is then slightly later connects
		// so we correct CONNECTING_FAILED to CONNECTED unless the box is connected by wire
		if(_self.localip != "192.168.5.1" && networkStatus == NetworkAPI.STATUS.CONNECTING_FAILED) {
			networkStatus = NetworkAPI.STATUS.CONNECTED;
		}
		
		_element.toggleClass("complex",(networkStatus !== NetworkAPI.STATUS.CONNECTED));
		
		if(_self.connecting) {
			clearTimeout(_delayedDestroy);
			_delayedDestroy = setTimeout(function() {
				console.log("delayed remove");
				//removeBox(box,true); 
				_self.destroy()
			}, 10000);
		}
	}
	this.destroy = function() {
		console.log("Box:destroy");
		clearTimeout(_delayedDestroy);
		
		_networkPanel.destroy();
		
		_element.fadeOut(500,function() {
			_element.remove();
		});
		
		if(_self.destroyedHandler) _self.destroyedHandler(_self);
	}
}