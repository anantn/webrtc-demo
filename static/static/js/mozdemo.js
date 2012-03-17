
var ui_log = function(msg) {
  var t = document.createTextNode(msg);
  var d = document.createElement("div");
  $(d).append(t);

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
  }
};


var CallingClient = function(config_, username, peer, video, start_call) {
  console.log("Calling client constructor");
  var poll_timeout = 500; // ms
  var config = $.extend({}, config_);
  var state = "INIT";

  var log = function(msg) {
    console.log("LOG (" + username + "): " + msg);
    ui_log("LOG (" + username + "): " + msg);
  };

  log("Calling client: user=" + username + " peer = " + peer);
  var webrtc = navigator.getWebrtcContext(JSON.stringify(config), function(msg) {
  	switch (msg) {
  	case "RINGING":
  		var answer = confirm("Incoming call! Accept?");
  		if (answer) webrtc.accept(video);
  		else webrtc.hangup();
  		break;
  	}
  });

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

  var internal_poll = function () {
    msg = webrtc.messagePoll();

    if (msg !== "") {
      log("Received message from webrtc subsystem");
      log(msg);


      var msg2 = {
        dest: peer,
        body: msg
      };

      log("Sending: " + JSON.stringify(msg2));

      ajax({
        url: "/msg/",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(msg2)
      });
    }

    setTimeout(internal_poll, 1000);
  };

  if (start_call) {
    log("Making call to " + peer);
    webrtc.startCall("1234", "127.0.0.1");
  } else {
    log("Waiting for call as " + username);
  }

  // Start polling
  poll();
  internal_poll();
};


default_config = {
  stun: 'stun.l.google.com:19302'
};

//new CallingClient(config, "abc", "def", video, true);