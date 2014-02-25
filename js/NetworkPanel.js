/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function NetworkPanel() {
	
	this.id;
	
	var NETWORK_SELECTOR_DEFAULT = "please select"; // used as first item in networks list
	//var NETWORK_SELECTOR_CUSTOM = "join other network...";
	
	// network mode
	NetworkPanel.NETWORK_MODE = {
		NEITHER: "neither",
		CLIENT: "clientMode",
		ACCESS_POINT: "accessPointMode"
	};
	var _networkMode = NetworkPanel.NETWORK_MODE.NEITHER;
	
	var _api = new NetworkAPI();
	var _networks = {};
	var _currentNetwork;					// the ssid of the network the box is on
	var _selectedNetwork;         // the ssid of the selected network in the client mode settings
	
	var _currentNetworkStatus;
	var _customNetwork = false;
	
	var _retryDelay = 2000;
	var _retryRetrieveStatusDelayTime = 1000;
	var _retryRetrieveStatusDelay;
	var _retrieveStatusDelayTime = 1000;
	var _retrieveStatusDelay;
	
	var _statusChangeHandler;
	
	// ui elements
	var _element;
	var _networkSelector;
	var _btnRefreshNetworks;
	var _networkField;
	var _btnListNetworks;
	var _passwordSettings;
	var _passwordField;
	var _btnConnect;
	var _statusTextField;
	var _actionTextField;
	
	var _self = this;
	
	this.init = function(wifiboxURL,panelElement,statusChangeHandler) {
		
		//console.log(_self.id,"NetworkPanel:init");
		
		_api.init(wifiboxURL);
		
		_element = panelElement;
		_networkSelector 		= _element.find("#network");
		_btnRefreshNetworks = _element.find("#refreshNetworks");
		_networkField 			= _element.find("#ssid");
		_btnListNetworks 		= _element.find("#listNetworks");
		_passwordSettings 	= _element.find("#passwordSettings");
		_passwordField 			= _element.find("#phrase");
		_btnConnect 				= _element.find("#btnConnect");
		_statusTextField	 	= _element.find("#status");
		_actionTextField	 	= _element.find("#action");
		
		_btnRefreshNetworks.on('touchstart mousedown',onRefreshClick);
		_btnListNetworks.on('touchstart mousedown',showNetworkSelector);
		//_btnConnect.on('touchstart mousedown',_self.connectToNetwork);
		_element.submit(connectToNetwork);
		
		_networkSelector.change(networkSelectorChanged);
		_networkSelector.blur(networkSelectorBlurred);
		_passwordField.showPassword();
		
		_statusChangeHandler = statusChangeHandler;
		
		_self.retrieveStatus(function(networkStatus) {
			if(networkStatus != NetworkAPI.STATUS.CONNECTED) {
				_self.refreshNetworks();			
			}
		}); 
	}
	/*
	 * Handlers
	 */
	function onRefreshClick() {
		_btnRefreshNetworks.attr("disabled", true);
		_self.refreshNetworks(function() {
			_btnRefreshNetworks.removeAttr("disabled");
		})
	}
	function networkSelectorChanged(e) {
		var selectedOption = $(this).find("option:selected");
		_self.selectNetwork(selectedOption.val());
	};
	function networkSelectorBlurred(e) {
		console.log("networkSelectorBlurred");
		var selectedOption = $(this).find("option:selected");
		//_self.selectNetwork(selectedOption.val());
	};
	
	
	this.retrieveStatus = function(completeHandler) {
		//console.log(_self.id,"NetworkPanel:retrieveStatus");
		_api.status(function(data) {
			if(typeof data.status === 'string') {
				data.status = parseInt(data.status);
			}
			//console.log(_self.id,"NetworkPanel:retrievedStatus status: ",data.status,data.statusMessage);
			//console.log("  networkPanel ",_element[0]," parent: ",_element.parent()[0]);
			// ToDo: update _currentNetwork when available
			
			setStatus(data.status,data);

			// Keep checking for updates?
			switch(data.status) {
				case NetworkAPI.STATUS.CONNECTING:
				case NetworkAPI.STATUS.CREATING:
					clearTimeout(_retryRetrieveStatusDelay);
					_retryRetrieveStatusDelay = setTimeout(_self.retrieveStatus,_retryRetrieveStatusDelayTime); // retry after delay
					break;
			}
			_currentNetworkStatus = data.status;
			if(completeHandler) completeHandler(data.status);
		}, function() {
			//console.log("NetworkPanel:retrieveStatus failed");
			clearTimeout(_retryRetrieveStatusDelay);
			_retryRetrieveStatusDelay = setTimeout(_self.retrieveStatus, _retryRetrieveStatusDelayTime); // retry after delay
		});
	};
	function setStatus(status,data) {
		if(status == _currentNetworkStatus) return;
		_currentNetworkStatus = status;
		var targetNetwork; 
		
		// update info
		switch(status) {
			case NetworkAPI.STATUS.CONNECTED:
				//console.log("  data.ssid: ",data.ssid);
				if(data.ssid == "") {
					_currentNetwork = undefined;
					//data.status = NetworkAPI.STATUS.NOT_CONNECTED;
					setStatus(NetworkAPI.STATUS.NOT_CONNECTED);
				} else {
					_currentNetwork = data.ssid;
				}
				break;
			case NetworkAPI.STATUS.CONNECTING:
				if(_selectedNetwork != undefined) {
					targetNetwork = _selectedNetwork;
				} else if(_currentNetwork != undefined) {
					targetNetwork = _currentNetwork;
				}
			case NetworkAPI.STATUS.CREATING:
			case NetworkAPI.STATUS.CREATED:					
				_currentNetwork = undefined;
				break;
		}
		// network selector
		switch(status) {
			case NetworkAPI.STATUS.NOT_CONNECTED:
			case NetworkAPI.STATUS.CREATING:
			case NetworkAPI.STATUS.CREATED:
				_networkSelector.val(NETWORK_SELECTOR_DEFAULT);
				break;
			case NetworkAPI.STATUS.CONNECTED:
				_self.selectNetwork(_currentNetwork);
				break;
			case NetworkAPI.STATUS.CONNECTING:
			case NetworkAPI.STATUS.CONNECTING_FAILED:
				// ToDo 
				break;
		}
		// connect button
		switch(status) {
			case NetworkAPI.STATUS.CONNECTING:
			case NetworkAPI.STATUS.CREATING:
				_btnConnect.attr("disabled", true);
				break;
			default:
				_btnConnect.removeAttr("disabled");
				break;
		}
		// update status text
		var statusText = "";
		switch(status) {
			case NetworkAPI.STATUS.CONNECTING:
				statusText = "Connecting... ";
				break;
			case NetworkAPI.STATUS.CONNECTING_FAILED:
				//msg = data.statusMessage;
				statusText = "Could not connect.";
				break;
		}
		_statusTextField.html(statusText);
		
		// update action text
		var actionText = "";
		switch(status) {
			case NetworkAPI.STATUS.CONNECTING:
				if(targetNetwork != undefined) {
					actionText = "Connect your device to <b>"+targetNetwork+"</b>.";
					_actionTextField.attr("class","info");
				}
				break;
			case NetworkAPI.STATUS.CONNECTING_FAILED:
				actionText = "Please check password";
				_actionTextField.attr("class","error");
				break;
		}
		_actionTextField.html(actionText);
			
		if(_statusChangeHandler) _statusChangeHandler(status);
	}
	this.refreshNetworks = function(completeHandler) {
		//console.log("NetworkPanel:refreshNetworks");
		_api.scan(function(data) { // completed
			//console.log("NetworkPanel:scanned");
			
			// order networks alphabetically
			/*data.networks.sort(function (a, b) {
				if (a.ssid > b.ssid)
					return 1;
				if (a.ssid < b.ssid)
					return -1;
				// a must be equal to b
				return 0;
			});*/
			
			fillNetworkSelector(data.networks)
			_networks = {};
			$.each(data.networks, function(index,network) {
				_networks[network.ssid] = network;
			});
			
			if(completeHandler) completeHandler();
		});
	};
	function fillNetworkSelector(networks) {
		var foundCurrentNetwork = false;
		_networkSelector.empty();
		_networkSelector.append(
				$("<option></option>").val(NETWORK_SELECTOR_DEFAULT).html(NETWORK_SELECTOR_DEFAULT)
		);
		$.each(networks, function(index,network) {
			if(network.ssid == _currentNetwork) {
				foundCurrentNetwork = true;
			}
			_networkSelector.append(
					$("<option></option>").val(network.ssid).html(network.ssid)
			);
		});
		/*_networkSelector.append(
				$("<option></option>").val(NETWORK_SELECTOR_CUSTOM).html(NETWORK_SELECTOR_CUSTOM)
		);*/
		if(foundCurrentNetwork) {
			_networkSelector.val(_currentNetwork);
			//_self.selectNetwork(_currentNetwork);
		}
	}
	
	this.selectNetwork = function(ssid) {
		//console.log("NetworkPanel:selectNetwork: ",ssid);
		if(ssid == "") return;
		_selectedNetwork = ssid;
		
		var network = _networks[ssid];
		//console.log("  network: ",network);
		/*if(ssid == NETWORK_SELECTOR_CUSTOM) {
			showCustomNetworkInput();
			_passwordSettings.show();
		} else*/ if(network === undefined || network.encryption == "none" || ssid == NETWORK_SELECTOR_DEFAULT) {
	  	_passwordSettings.hide();
	  } else {
	  	_passwordSettings.show();
	  }
	  _passwordField.val("");
	};
	
	function showNetworkSelector() {
		_customNetwork = false;
		_element.removeClass("customNetwork");
		_networkSelector.val(NETWORK_SELECTOR_DEFAULT);
	}
	/*function showCustomNetworkInput() {
		_customNetwork = true;
		_element.addClass("customNetwork");
	}*/
	
	function connectToNetwork() {
		//console.log("NetworkPanel:connectToNetwork");
		if(_selectedNetwork == NETWORK_SELECTOR_DEFAULT) return;
		
		setStatus(NetworkAPI.STATUS.CONNECTING); // override status
		
		var ssid = (_customNetwork)? _networkField.val() : _selectedNetwork;
		_api.associate(ssid,_passwordField.val(),true);
		
		// after switching wifi network or creating a access point we delay the status retrieval
		// because the webserver needs time to switch it's status
		clearTimeout(_retrieveStatusDelay);
		_retrieveStatusDelay = setTimeout(_self.retrieveStatus, _retrieveStatusDelayTime);
		
		return false;
	};
	this.destroy = function() {
		clearTimeout(_retryRetrieveStatusDelay);
		clearTimeout(_retrieveStatusDelay);
	}
}
