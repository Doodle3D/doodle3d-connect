
var retrieveListInterval 	= 2000;
var retrieveListDelay; 			// retry setTimout instance
var boxTimeoutTime 				= 300;

var numBoxesChecking 			= 0; // count how many boxes we are checking
var numBoxesFound 				= 0; // count how many boxes responded

var $list;
var $intro;
var $preloader;
var spinner;

$(function() {
  //console.log("ready");
	
	$intro = $("#intro");
	$list = $("#list");
	$preloader = $("#preloader");
	
	var spinnerSettings = {
	  lines: 13, // The number of lines to draw
	  length: 5, // The length of each line
	  width: 3, // The line thickness
	  radius: 7, // The radius of the inner circle
	  corners: 1, // Corner roundness (0..1)
	  rotate: 0, // The rotation offset
	  direction: 1, // 1: clockwise, -1: counterclockwise
	  color: '#58C143', // #rgb or #rrggbb or array of colors
	  speed: 1, // Rounds per second
	  trail: 60, // Afterglow percentage
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
})
function retrieveList() {
	$preloader.show();
	//spinner.spin($preloader[0]);
	
	$.ajax({
		url: "list.php",
		dataType: 'json',
		success: function(response){
			//console.log("retrieveList response: ",response);
			if(response.status == "success") {
				updateList(response.data);
			}
			clearTimeout(retrieveListDelay);
			retrieveListDelay = setTimeout(retrieveList, retrieveListInterval);
		}
	}).fail(function() {
		//console.log("retrieveList: failed");
		clearTimeout(retrieveListDelay);
		retrieveListDelay = setTimeout(retrieveList, retrieveListInterval); // retry after delay
	});
}
function updateList(boxes) {
	$list.empty();
	numBoxesChecking = 0;
	numBoxesFound = 0;
	jQuery.each(boxes, function (index,box) {
		checkBox(box);
	});
	updateIntro();
}
function checkBox(box) {
	numBoxesChecking++;
	$.ajax({
		url: "http://"+box.localip+"/d3dapi/network/status",
		dataType: 'json',
		timeout: boxTimeoutTime,
		success: function(response){
			if(response.status == "success") {
				numBoxesFound++;
				var url = "http://"+box.localip;
				if(boxIsListed(url)) return;
				
				$list.append("<li><a href='"+url+"'>"+box.wifiboxid+"</a></li>");
			}
			numBoxesChecking--;
			updateIntro();
		}
	}).fail(function() {
		numBoxesChecking--;
		updateIntro();
	});
}
function boxIsListed(url){
	return $list.find("a[href|='"+url+"']").length > 0;
}
function updateIntro() {
	if(numBoxesChecking <= 0) {
		if(numBoxesFound > 0) {
			$intro.html("Found the following boxes near you:");
		} else {
			$intro.html("No boxes found near you.");
		}
		$preloader.fadeOut(1000);
	}
}