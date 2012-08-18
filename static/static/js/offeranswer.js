var log = function(msg) {
    console.log("LOG: " + msg);
    ui_log("LOG: " + msg);
};

var failure = function(x) {
    log("ERROR " + x);
};

var ready = function() {
    log("READY!");
};

var deobjify = function(x) {
    return JSON.parse(JSON.stringify(x));
};

var pc;
var num_streams = 0;


$(function () {
      pc = createPeerConnection();
    
      if (pc) {
	  log("Created Webrtc object");
      }
      else {
	  log("Failure creating Webrtc object");
      }

      var divs = {
          local_video : document.getElementById("localvideo"),
          local_audio : document.getElementById("localaudio")
      };

    pc.onRemoteStreamAdded = function(obj) {
	log("Got remote stream of type " + obj.type);
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

});




var createOffer = function() {
    log ("Creating offer");
    
    
    createOfferWrap(pc,
	            function(offer) {
			offer = deobjify(offer);
                        log("Got offer "+ offer.sdp);
                        $("#offer").val(offer.sdp);
                    }, failure);
};


var setRemoteOffer = function() {
    log("Setting remote");
    var offer = $("#offer").val();
    offer = offer.replace("/\n/g", "\r\n");
    console.log(offer);
    setRemoteWrap(pc,
                  {
                      type : "offer",
                      sdp : offer
                  },
                  function() {
                      log("Successfully set remote");
                  }, failure);
};



