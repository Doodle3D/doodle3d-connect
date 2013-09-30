var retrieveListDelay; 	// retry setTimout instance
var retrieveListInterval = 5000;
var boxTimeoutTime = 300;
var $list;

$(function() {
  //console.log("ready");
  retrieveList();
  
  $list = $("#list");
})
function retrieveList() {
    $.ajax({
      url: "list.php",
      dataType: 'json',
      timeout: boxTimeoutTime,
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
	jQuery.each(boxes, function (index,box) {
		checkBox(box);
	});
}
function checkBox(box) {
	$.ajax({
		url: "http://"+box.localip+"/d3dapi/network/status",
		dataType: 'json',
		success: function(response){
			if(response.status == "success") {
				var url = "http://"+box.localip;
				if(boxIsListed(url)) return;
				$list.append("<li><a href='"+url+"'>"+box.wifiboxid+"</a></li>");
			}
		}
	});
}
function boxIsListed(url){
	return $list.find("a[href|='"+url+"']").length > 0;
}