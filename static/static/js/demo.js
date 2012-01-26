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


var CallingClient = function(config_, username, peer, video_, start_call) {
    console.log("Calling client constructor");
    var poll_timeout = 500; // ms
    
    var config = $.extend({}, config_);
    var video = $.extend({}, video_);
    var state = "INIT";
    
    if (!config.stun) {
	console.log("Need to provide STUN server");
	return;
    }

    var log = function(msg) {
	console.log("LOG (" + username + "): " + msg);
//	ui_log("LOG (" + username + "): " + msg);
    };

    // Signaling methods    
    var signaling = function(msg_) {
	var msg = {
	    dest:peer,
	    body:msg_
	};

//	log("Sending: " + JSON.stringify(msg));
	log("Sending");

	ajax({
		 url : "/msg/",
		 type:"POST",
		 contentType:"application/json",
		 data: JSON.stringify(msg),
	     });
    };

    var poll_success = function(msg) {
	var js = JSON.parse(msg);
//	log("Received message " + JSON.stringify(js));
	log("Received message");
	
	if (state == "INIT")
	    addStream();

	pc.processSignalingMessage(js.body);
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

    // Media processing
    var mediasuccess = function(ev) {
	log("Got stream");
	pc.addStream(stream);
	state = "STARTED";

	// Set video
	var url = webkitURL.createObjectURL(ev.stream);
	if (video) {
	    video.local.style.opacity = 1;
	    video.local.src = webkitURL.createObjectURL(stream);
	};
    };

    var mediafailure = function() {
	console.log("Couldn't get media");
    };
    var addStream = function() {
	try {
	    navigator.webkitGetUserMedia( video ? "video, audio" : "video",
					  mediasuccess, mediafailure);
	} catch (x) {
	    console.log("Couldn't get media stream: "+ x);
	}
    };
    

    var onAddStream = function(stream) {
	log("onAddStream()");
	// Set video
	var url = webkitURL.createObjectURL(stream);
	if (video) {
	    video.remote.style.opacity = 1;
	    video.remote.src = webkitURL.createObjectURL(stream);
	};
	
    };

    var onConnecting = function() {
	log("onConnecting()");
    };

    var onMessage = function() {
	log("onMessage()");
    };
    var onOpen = function() {
	log("onOpen()");
    };
    var onRemoveStream = function() {
	log("onRemoveStream()");
    };
    

    var pc = new webkitPeerConnection("STUN "+config.stun, signaling);
    pc.onaddstream = onAddStream;
    pc.onconnecting = onConnecting;
    pc.onmessage = onMessage;
    pc.onopen = onOpen;
    pc.onremovestream = onRemoveStream;

    console.log("Made PeerConnection");

    if (start_call) {
	addStream();
    }

    // Start polling
    poll();
};


default_config = {
    stun:'stun.l.google.com:19302'
};

//new CallingClient(config, "abc", "def", video, true);