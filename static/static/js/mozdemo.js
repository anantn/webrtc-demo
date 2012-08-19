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



var getUserMedia = undefined;
var createPeerConnection = undefined;
var attachStream = undefined;
var createOfferWrap = undefined;
var createAnswerWrap = undefined;

// Detect which browser we are on and wire up the functions
// appropriately
if (navigator.mozGetUserMedia) {
    console.log("We seem to be on Firefox");   
    getUserMedia = function(prefs, success, failure) {
        navigator.mozGetUserMedia(prefs, success, failure);
    };
    createPeerConnection = function() {
        return new mozPeerConnection();        
    };
    attachStream = function(obj, stream) {
        obj.src = stream;
        obj.play();
    };
    createOfferWrap = function (p, success, failure) {
      p.createOffer(success, failure);
    };
    createAnswerWrap = function (p, offer, success, failure) {
      p.createAnswer(offer, success, failure);
    };
    setRemoteWrap = function(p, msg, success, failure) {
        p.setRemoteDescription(msg, success, failure);
    };
    setLocalWrap = function(p, msg, success, failure) {
        p.setLocalDescription(msg, success, failure);
    };
} else if(navigator.webkitGetUserMedia) {
    console.log("This appears to be Chrome");
    getUserMedia = function(prefs, success, failure) {
        navigator.webkitGetUserMedia(prefs, success, failure);
    };
    createPeerConnection = function() {
        return new webkitPeerConnection00("STUN stun.l.google.com:19302", 
                                          function(candidate) {
                                              console.log("Got ice candidate " + candidate);
                                              console.log("discarding");
                                          }
                                         );
    };
    attachStream = function(obj, stream) {
        obj.src = webkitURL.createObjectURL(stream);
        obj.play();
    };
    createOfferWrap = function (p, success, failure) {
        var offer = p.createOffer({audio:true, video:true});
        setTimeout(function() {
                       success({
                                   type:'offer',
                                   sdp:offer.toSdp()
                               });
                   }, 1);
    };
    createAnswerWrap = function (p, offer, success, failure) {
	console.log ("Calling createAnswer with offer= " + offer.sdp);

        var answer = p.createAnswer(offer.sdp,
				    {audio:true, video:true});
        setTimeout(function() {
                       success({
                                   type:'answer',
                                   sdp:answer.toSdp()
                               });
                   }, 1);
    };
    setRemoteWrap = function(p, msg, success, failure) {
	try {
            if (msg.type === "offer") {
		p.setRemoteDescription(p.SDP_OFFER, new SessionDescription(msg.sdp));
            } else {
		p.setRemoteDescription(p.SDP_ANSWER, new SessionDescription(msg.sdp));
            }
	} catch (x) {
	    failure();
	    return;
	}
	success();
    };
    setLocalWrap = function(p, msg, success, failure) {
	try {
            if (msg.type === "offer") {
		p.setLocalDescription(p.SDP_OFFER, new SessionDescription(msg.sdp));
            } else {
		p.setLocalDescription(p.SDP_ANSWER, new SessionDescription(msg.sdp));
            }
	} catch (x) {
	    failure();
	    return;
	}
	success();
    };
} else {
    console.log("Can't find any WebRTC implementation");
}

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
    
	if (js.body.type == "answer") {
            try {
                setRemoteWrap(pc,
	                      js.body,
			      function() {
				  log("Set remote for " + js.body.type + " succeeded");
				  log("CALL ESTABLISHED!");
			      }, failure);
            } catch (x) {
                log("setRemoteDescription threw an exception " + x);
                console.log(x);
            }
	} else {
            try {
                setRemoteWrap(pc,
	                      js.body,
			      function() {
				  log("Set remote for " + js.body.type + " succeeded");
				  log("Calling create answer");
				  createAnswer(js.body);
			      }, failure);
            } catch (x) {
                log("We threw an exception " + x);
                console.log(x);
            }
	}

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


    var check_feature = function(x) {
	return $("#" + x).is(":checked");
    };

    var add_after = function(arr, prefix, toadd) {
	var narr = [];
	
	arr.forEach(function(line) {
			narr.push(line);
			if (line.indexOf(prefix) === 0) {
			    narr.push(toadd);
			}
		    });
	
	return narr;
    };

    var modify_description = function(desc_in) {
	var desc = desc_in.split("\r\n");

	if (check_feature("add_crypto")) {
	    log("adding crypto line");
	    desc = add_after(desc, "m=", "a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:KXvY8nSATwMTahhXJmhqWofkNUk4jelbIFzo7YyE");
	};

	return desc.join("\r\n");
    };

    // Signaling methods    
    var send_sdpdescription= function(sdp) {
	log("Modifying description");
	
	var newbody = modify_description(sdp.sdp);
	
	log("Modified SDP body = " + newbody);

	var newsdp = {
	    type:sdp.type,
	    sdp:newbody
	};

	var msg = {
	    dest:peer,
	    body: newsdp
	};
	

	
	log("Sending: " + JSON.stringify(msg));

	ajax({
		 url : "/msg/",
		 type:"POST",
		 contentType:"application/json",
		 data: JSON.stringify(msg),
	     });
    };


    var deobjify = function(x) {
	return JSON.parse(JSON.stringify(x));
    };

    var createOffer = function() {
        createOfferWrap(pc, 
	                function(offer) {
			    offer = deobjify(offer);
                            log("Got offer "+ offer);
			    send_sdpdescription(offer);
			    setLocalWrap(pc, offer,
					 function() {
					     log("Set local for offer succeeded");
					 }, failure);
                        }, failure);
    };

    var createAnswer = function(offer) {
	createAnswerWrap(pc,
                         offer, function(answer) {
			     answer = deobjify(answer);
                             log("Got answer "+ answer);
			     send_sdpdescription(answer);
			     setLocalWrap(pc, answer,
					  function() {
					      log("Set local for answer succeeded");
					      log("CALL ESTABLISHED!");
					  }, failure);
                         }, failure);
    };
        
    var ready = function() {
	log("start_call=" + start_call);

        if (start_call != "false") {
            log("Making call to " + peer);
	    createOffer();
        } else {
            log("Waiting for call as " + username);
        }

        // Start polling
        poll();
    };

    
    log("Calling client: user=" + username + " peer = " + peer);
    var pc = createPeerConnection();
    
    if (pc) {
        log("Created Webrtc object");
    }
    else {
        log("Failure creating Webrtc object");
    }


    // Set callbacks or new media streams
    pc.onRemoteStreamAdded = function(obj) {
	log("Got remote stream of type " + obj.type);
	if (obj.type === "video") {
            attachStream(divs.remote_video, obj.stream);
	} else if (obj.type == "audio") {
            attachStream(divs.remote_audio, obj.stream);
	} else {
	    log("ERROR: Unknown stream type");	    
	}
    };

    log("Calling get user media");
    // Get the video stream
    getUserMedia({video:true}, function(stream){
                     // Attach to the local element
                     log("Got video stream");
                     attachStream(divs.local_video, stream);

                     // Add to the PC
                     video_stream = stream;
                     pc.addStream(stream);
                     num_streams++;
                     
                     log("Total streams " + num_streams);

                     if (num_streams == 2) {
                         ready();
                     }
                 },
                 function() {
                     log("Could not get video stream");
                 });
    // Get the audio stream
    getUserMedia({audio:true}, function(stream){
                     log("Got audio stream");
                     // Attach to the local element
                     attachStream(divs.local_audio, stream);

                     // Add to the PC
                     audio_stream = stream;
                     pc.addStream(stream);
                     num_streams++;

                     log("Total streams " + num_streams);

                     if (num_streams == 2) {
                         ready();
                     }
                 }, function() {
                     log("Could not get audio stream");
                 });

    return {
    	createOffer : createOffer
    };
};

default_config = {
    stun: 'stun.l.google.com:19302'
};

