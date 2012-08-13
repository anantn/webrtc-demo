// Boilerplate
var ui_log = function(msg) {
    var log = "<p>";
    log += msg.replace("\\r\\n", "<br/>");
    log += "</p>"

    var d = document.createElement("div");
    d.innerHTML = log;

    $("#logwindow").append(d);
};

// simple wrapper around XHR. The cool kids use JQuery here, but
// we want a self-contained example
var ajax = function (params) {
    var xhr = new XMLHttpRequest();
    xhr.open(
        params.type || "GET", params.url, true);
    if (params.contentType) {
        xhr.setRequestHeader("Content-Type", params.contentType)
    }
    if (params.data) {
        xhr.send(params.data);
    } else {
        xhr.send();
    }
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                if (params.success) {
                    params.success(xhr.responseText);
                }
            } else {
                if (params.error) {
                    params.error(xhr.responseText);
                }
            }
        }
    };
};



var CallingClient = function(config_, username, peer, divs, start_call) {
    console.log("Calling client constructor");
    var poll_timeout = 500; // ms
    var config = $.extend({}, config_);
    var state = "INIT";

    var audio_stream = undefined;
    var video_stream = undefined;
    var pc = undefined;
    var num_streams = 0;

    var log = function(msg) {
        console.log("LOG (" + username + "): " + msg);
        ui_log("LOG (" + username + "): " + msg);
    };

   
    var poll_success = function(msg) {
        var js = JSON.parse(msg);
        log("Received message " + JSON.stringify(js));
        
        webrtc.processMessage(js.body);
        setTimeout(poll, poll_timeout);
    };
    
    var poll_error = function (msg) {
        setTimeout(poll, poll_timeout);
    };
    
    var poll = function () {
        ajax({
                 url: "/msg/" + username + "/",
                 success: poll_success,
                 error: poll_error
             });
    };

    var failure = function(x) {
        log("ERROR " + x);
    };

    var ready = function() {
        if (start_call != "false") {
            log("Making call to " + peer);
            pc.createOffer(function(offer) {
                               log("Got offer "+ offer);
                           });
        } else {
            log("Waiting for call as " + username);
        }

        // Start polling
        poll();
    };

    // Signaling methods    
    var gnaling = function(type, body) {
	var msg = {
	    dest:peer,
	    body: {
                type : type,
                body : body
            }
	};

	log("Sending: " + JSON.stringify(msg));

	ajax({
		 url : "/msg/",
		 type:"POST",
		 contentType:"application/json",
		 data: JSON.stringify(msg),
	     });
    };

    log("Calling client: user=" + username + " peer = " + peer);
    var pc = new mozPeerConnection();
    
    if (pc) {
        log("Created Webrtc object");
    }
    else {
        log("Failure creating Webrtc object");
    }

    log("Calling get user media");
    // Get the video stream
    navigator.mozGetUserMedia({video:true}, function(stream){
                                  // Attach to the local element
                                  log("Got video stream");
                                  divs.local_video.src = stream;
                                  divs.local_video_src.play();

                                  // Add to the PC
                                  video_stream = stream;
                                  pc.addStream(stream);
                                  num_streams++;
                                  if (num_streams == 2) {
                                      ready();
                                  }
                              },
                              function() {
                                  log("Could not get video stream");
                              });
    if (false) {
        
    // Get the audio stream
    navigator.mozGetUserMedia({audio:true}, function(stream){
                                  log("Got audio stream");
                                  // Attach to the local element
                                  divs.local_audio.src = stream;
                                  divs.local_audio_src.play();
                                  
                                  // Add to the PC
                                  audio_stream = stream;
                                  pc.addStream(stream);
                                  num_streams++;
                                  if (num_streams == 2) {
                                      ready();
                                  }
                              }, function() {
                                  log("Could not get audio stream");
                              });
    }
};

default_config = {
    stun: 'stun.l.google.com:19302'
};

