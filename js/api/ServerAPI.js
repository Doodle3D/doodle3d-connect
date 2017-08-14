/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function ServerAPI() {
	var _apiURL = "";
	var _timeoutTime = 6000;

	this.init = function(url) {
		_apiURL = url;
	}

	this.getInfo = function(uuid, completeHandler, failedHandler) {
		console.log("ServerAPI:getInfo");

		$.ajax({
			url: _apiURL + "/info/" + uuid,
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			cache: false,
			success: function(response) {
				if (completeHandler) completeHandler(response);
			}
		}).fail(function(response) {
			if (failedHandler) failedHandler(response.responseJSON);
		});
	};

	this.fetch = function(uuid, chunk, completeHandler, failedHandler) {
		console.log("ServerAPI:fetch",uuid,chunk);

		if (!uuid) {
			console.log("Server.fetch failed: no uuid");
			if (failedHandler) failedHandler();
			return;
		}

		if (!chunk) {
			chunk = 0;
		}

		$.ajax({
			url: _apiURL + "/fetch/" + uuid + "/" + chunk,
			type: "GET",
			dataType: 'text', //no json but text
			timeout: _timeoutTime,
			cache: false,
			success: function(response) {
				if (completeHandler) completeHandler(response);
			}
		}).fail(function(response) {
			console.log("ServerAPI:fetch fail response:",response);
			if (failedHandler) failedHandler(response.responseJSON);
		});
	};

	this.fetchHeader = function(uuid,completeHandler,failedHandler) {
		this.fetch(uuid,0,function(successData) {
			console.log("_serverAPI fetchHeader");
			if (successData) {
				var items = successData.split("\n");
				try {
					var headerText = items[0].substr(1);
					var headerJSON = JSON.parse(headerText);
					// console.log("fetchHeader",headerJSON)
					if (completeHandler) completeHandler(headerJSON);
				} catch (e) {
					console.log("fetchHeader failed to parse JSON",e);
					if (failedHandler) failedHandler();						
				}
			}
		}, function(failData) {
			console.log("_serverAPI fetchHeader failed",failData);
		});
	};

}