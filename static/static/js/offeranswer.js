var log = function(msg) {
    console.log("LOG: " + msg);
    ui_log("LOG: " + msg);
};

var failure = function(x) {
    log("ERROR " + x);
};

var pc;

$(function () {
      pc = createPeerConnection();
    
      if (pc) {
	  log("Created Webrtc object");
      }
      else {
	  log("Failure creating Webrtc object");
      }
});





