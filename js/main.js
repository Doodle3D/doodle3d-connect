/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
var retrieveListInterval 	= 3000;
var retrieveListDelay; 			// retry setTimout instance
var boxTimeoutTime 				= 500;

var numBoxesChecking 			= 0; // count how many boxes we are checking
var numBoxesFound 				= 0; // count how many boxes responded

var connectedBox = {localip:"192.168.5.1",wifiboxid:"Wired WiFi-Box"};
var apBox = {localip:"192.168.10.1",wifiboxid:"WiFi-Box",link:"http://draw.doodle3d.com"};
var connectAPI = "http://connect.doodle3d.com/api"

var $list;
var $intro;
var $hint;
var $preloader;
var spinner;

var boxes = {};
var numBoxes = 0;

var networkAPI = new NetworkAPI();
var connectAPI = new ConnectAPI();

$(function() {
//  console.log("ready");
	
	networkAPI.init();
	
  $intro = $("#intro");
	$list = $("#list");
	
	$hint = $("#hint");
	$preloader = $("#preloader");
	
	var spinnerSettings = {
	  lines: 7, // The number of lines to draw
	  length: 0, // The length of each line
	  width: 14, // The line thickness
	  radius: 15, // The radius of the inner circle
	  corners: 1, // Corner roundness (0..1)
	  rotate: 0, // The rotation offset
	  direction: 1, // 1: clockwise, -1: counterclockwise
	  color: '#57BF42', // #rgb or #rrggbb or array of colors
	  speed: 1.2, // Rounds per second
	  trail: 69, // Afterglow percentage
	  shadow: false, // Whether to render a shadow
	  hwaccel: false, // Whether to use hardware acceleration
	  className: 'spinner', // The CSS class to assign to the spinner
	  zIndex: 2e9, // The z-index (defaults to 2000000000)
	  top: 'auto', // Top position relative to parent in px
	  left: 'auto' // Left position relative to parent in px
	};
	spinner = new Spinner(spinnerSettings); 
	spinner.spin($preloader[0]);
	
  retrieveList();
  
  // make sure all links are opened in same WebApp (added to homescreen) 
  // and they don't start a browser
  $.stayInWebApp('a',true);
});

function retrieveList() {
	$preloader.show();
	//spinner.spin($preloader[0]);
	connectAPI.list(function(foundBoxes) {
		//console.log("  foundBoxes: ",foundBoxes);
		foundBoxes.push(connectedBox);
		updateList(foundBoxes);
		clearTimeout(retrieveListDelay);
		retrieveListDelay = setTimeout(retrieveList, retrieveListInterval);
		removeBox(apBox.localip,true);
	}, function() {
		// if web is not accessible try to find the box as an accesspoint
		// if not found, we look for a wired box
		networkAPI.alive(apBox.localip,boxTimeoutTime,function() {
			updateList([apBox]);
		}, function() {
			updateList([connectedBox]);
		});
		clearTimeout(retrieveListDelay);
		retrieveListDelay = setTimeout(retrieveList, retrieveListInterval); // retry after delay
	});
}

function updateList(foundBoxes) {
	//console.log("updateList");
	numBoxesChecking = 0;
	numBoxesFound = 0;
	
  if (foundBoxes===undefined) foundBoxes = [];
  
  // remove displayed, but not found boxes
	jQuery.each(boxes, function (index,box) {
		var found = false;
		jQuery.each(foundBoxes, function (index,foundBox) {
			if(foundBox.localip == box.localip && 
					foundBox.wifiboxid == box.wifiboxid) found = true;
		});
		if(!found) removeBox(box.localip);
	})
	
	// check if all found boxes are alive
	jQuery.each(foundBoxes, function (index,foundBox) {
		checkBox(foundBox);
	});
	
	updateIntro();
}

function checkBox(boxData) {
	//console.log("  checkBox: ",boxData.localip);
	numBoxesChecking++;
	
	networkAPI.alive(boxData.localip,boxTimeoutTime,function() {
		addBox(boxData);
		numBoxesFound++;
		numBoxesChecking--;
	}, function() {
		removeBox(boxData.localip);
		numBoxesChecking--;
	});
}
function getBox(localip) {
	return boxes[localip];
}
function addBox(boxData) {
	if(getBox(boxData.localip) !== undefined) return;
	//console.log("addBox: ",boxData.localip);
	var box = new Box();
	box.init(boxData,$list);
	box.destroyedHandler = boxDestroyedHandler;
	boxes[box.localip] = box;
	numBoxes++;
	updateIntro();
}
function removeBox(localip,force) {
	var box = getBox(localip);
	if(box === undefined) return;
	//console.log("removeBox: ",localip," force: ",force);
	if(!force && box.connecting) return;
	//console.log("  calling destroyed");
	box.destroy();
}
function boxDestroyedHandler(box) {
	//console.log("boxDestroyedHandler");
	delete boxes[box.localip];
	numBoxes--;
	updateIntro();
}

function updateIntro() {
	//console.log("updateIntro,  numBoxes: ",numBoxes);
	if(numBoxes > 0) {
		$intro.html("Found the following boxes near you:");
		$hint.fadeOut();
	} else {
		$intro.html("No boxes found near you.");
		$hint.fadeIn();
	}
	$preloader.fadeOut(1000);
}