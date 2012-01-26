var ui_log = function(msg) {
    var t = document.createTextNode(msg);
    var d = document.createElement("div");
    $(d).append(t);

    $("#logwindow").append(d);
};


// simple wrapper around XHR. The cool kids use JQuery here, but
// we want a self-contained example
var ajax = function(params) {
    var xhr = new XMLHttpRequest();
    xhr.open(
	params.type || "GET",
	params.url,
	true);
    if(params.contentType){
	xhr.setRequestHeader("Content-Type",params.contentType)
    }
    if(params.data){
	xhr.send(params.data);
    }
    else{
	xhr.send();
    }
    xhr.onreadystatechange = function() {
	if(xhr.readyState === 4) {
	    if(xhr.status === 200) {
		if(params.success){
		    params.success(xhr.responseText);
		}
	    }
	    else {
		if (params.error) {
		    params.error(xhr.responseText);
		}
	    }
	}
    }
};


var CallingClient = function(username, peer, start_call, config_) {
    var poll_timeout = 1000; // ms
    
    var config = $.extend({}, config_);

    if (!config.stun) {
	alert("Need to provide STUN server");
	return;
    }

    var log = function(msg) {
	console.log("LOG (" + username + "): " + msg);
	ui_log("LOG (" + username + "): " + msg);
    };
    
    var signaling = function(msg) {
	msg.dest = peer;

	log("Sending: " + JSON.stringify(msg));

	ajax({
		 url : "/msg/",
		 type:"POST",
		 contentType:"application/json",
		 data: JSON.stringify(msg),
	     });
    };

    var poll_success = function(msg) {
	var js = JSON.parse(msg);
	log("Received message " + JSON.stringify(js));
	
	pc.processSignalingMessage(js);
    };
        
    var poll_error = function(msg) {
	setTimeout(poll, poll_timeout);
    };

    var poll = function() {
	ajax({
		 url: "/msg/" + username + "/",
		 success:poll_success,
		 error:poll_error
	     });
    };

    var addStream = function() {
	navigator.webkitGetUserMedia('video', function(stream) {
					 console.log("Got stream");
//					 pc.addStream(stream);
				     },
				     function() {
					 console.log("Couldn't create stream");
				     });
    };

    var pc = new webkitPeerConnection("STUN "+config.stun, signaling);
    
    console.log("Made PeerConnection");

    if (start_call) {
	pc.addStream(addStream());
    }

    // Start polling
    poll();
};


config = {
    stun:'stun.l.google.com:19302'
};

new CallingClient("abc", "def", true, config);