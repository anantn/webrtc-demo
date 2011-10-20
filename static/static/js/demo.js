var ui_log = function(msg) {
    var t = document.createTextNode(msg);
    var d = document.createElement("div");
    $(d).append(t);

    $("#logwindow").append(d);
};


var ROAPClient = function(username, peer, start_call) {
    var poll_timeout = 1000; // ms
    
    var log = function(msg) {
	console.log("LOG (" + username + "): " + msg);
	ui_log("LOG (" + username + "): " + msg);
    };
    
    var signaling = function(msg) {
	msg.dest = peer;

	log("Sending: " + JSON.stringify(msg));

	$.ajax({
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
	$.ajax({
		   url: "/msg/" + username + "/",
		   success:poll_success,
		   error:poll_error
	       });
    };

    var pc = new PeerConnection({}, signaling);
    
    if (start_call) {
	pc.addStream();
    }

    // Start polling
    poll();
};



var ROAPTest = function() {
    var caller = new ROAPClient("alice", "bob", true);
    var callee = new ROAPClient("bob", "alice");
};