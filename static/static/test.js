var runtests = function() {
    run_message_bus_tests();
    run_peer_connection_tests();
};

var run_message_bus_tests= function() {
    module("Message Bus");
    var test_message = {
	dest:'alice',
	body: {
	    a:1,
	    b:'def'
	}
    };

    asyncTest("Reset the message bus", function() {
                  $.ajax({
			     url : "/reset/",
			     type:"POST",
                             success: function() {
				 ok(true);
				 start();
			     },
			     error : function() {
				 ok(false);
			     }
			 });
	      });

    asyncTest("Send to Alice 1", function() {
                  $.ajax({
			     url : "/msg/",
			     type:"POST",
			     contentType:"application/json",
			     data: JSON.stringify(test_message),
                             success: function() {
				 ok(true);
				 start();
			     },
			     error : function() {
				 ok(false);
			     }
			 });
	      });

    asyncTest("Send to Alice 2", function() {
                  $.ajax({
			     url : "/msg/",
			     type:"POST",
			     contentType:"application/json",
			     data: JSON.stringify(test_message),
                             success: function() {
				 ok(true);
				 start();
			     },
			     error : function() {
				 ok(false);
			     }
			 });
	      });

    asyncTest("Recv for Alice 1", function() {
                  $.ajax({
			     url : "/msg/alice/",
                             success: function() {
				 ok(true);
				 start();
			     },
			     error : function() {
				 ok(false);
			     }
			 });
	      });

    asyncTest("Recv for Alice 2", function() {
                  $.ajax({
			     url : "/msg/alice/",
                             success: function() {
				 ok(true);
				 start();
			     },
			     error : function() {
				 ok(false);
			     }
			 });
	      });

    asyncTest("Recv for Alice 3 -- should be empty", function() {
                  $.ajax({
			     url : "/msg/alice/",
                             success: function() {
				 ok(false);
			     },
			     error : function() {
				 ok(true);
				 start();
			     }
			 });
	      });
};




var test_ctx = {};

var run_peer_connection_tests= function() {

    module("Peer Connection");
    
    test("create peerconnection", function() {
	     text = new PeerConnection();
	 });
};
