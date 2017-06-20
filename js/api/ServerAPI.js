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
			console.log("fail");
			if (failedHandler) failedHandler();
		});
	};

	// '/fetch/'+uid.value+'/'+line.value;


}
