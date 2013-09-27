var retrieveListDelay; 	// retry setTimout instance
var retrieveListInterval = 5000;
var $list;

$(function() {
  //console.log("ready");
  retrieveList();
  
  $list = $("#list");
})
function retrieveList() {
    $.ajax({
      url: "/list.php",
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
	//console.log("list: ",boxes);
	$list.empty();
	jQuery.each(boxes, function (index,box) {
		$list.append("<li><a href='/"+box.localip+"'>"+box.wifiboxid+"</a></li>");
	});
}