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



var CallingClient = function(config_, username, peer, video_, ready_cb) {
    var poll_timeout = 1000; // ms
    var pc = null;    
    var config = $.extend({}, config_);
    var video = $.extend({}, video_);
    var state = "INIT";
    var localstream = null;

    
    if (!config.stun) {
	console.log("Need to provide STUN server");
	return;
    }

    var log = function(msg) {
	console.log("LOG (" + username + "): " + msg);
	ui_log("LOG (" + username + "): " + msg);
    };

    // Signaling methods    
    var signaling = function(msg_) {
	var msg = {
	    dest:peer,
	    body:msg_
	};

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
	
	if (!pc) {
	    startup();
	}
	
	pc.processSignalingMessage(js.body);

	setTimeout(poll, poll_timeout);
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
    var mediasuccess = function(stream) {
	log("Got stream");
	state = "STARTED";
	localstream = stream;

	// Set video
	if (video) {
//	    video.local.style.opacity = 1;
	    video.local.src = webkitURL.createObjectURL(stream);
	};

	poll();
	ready_cb();
    };

    var mediafailure = function() {
	console.log("Couldn't get media");
    };
    var addStream = function() {
	console.log("Adding a stream");
	try {
	    navigator.webkitGetUserMedia( video ? "video, audio" : "video",
					  mediasuccess, mediafailure);
	} catch (x) {
	    console.log("Couldn't get media stream: "+ x);
	}
    };
    

    var onAddStream = function(ev) {
	log("onAddStream()");
	
	// Set video
	if (video) {
//	    video.remote.style.opacity = 1;
	    video.remote.src = webkitURL.createObjectURL(ev.stream);
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
    
    var onStateChange = function() {
	log("onStateChange()");
	log("state = " + pc.readyState);
    };

    var startup = function() {
	pc = new webkitPeerConnection("STUN "+config.stun, signaling);
	pc.onaddstream = onAddStream;
	pc.onconnecting = onConnecting;
	pc.onmessage = onMessage;
	pc.onopen = onOpen;
	pc.onremovestream = onRemoveStream;
	pc.onstatechange = onStateChange;
	pc.addStream(localstream);
	console.log("Made PeerConnection");
    };

    // This is needed
    addStream();

    return {
	startup:startup
    };
};



default_config = {
    stun:'stun.l.google.com:19302'
};

//new CallingClient(config, "abc", "def", video, true);


