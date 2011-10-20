var express = require('express');

var app = express.createServer(express.logger());
app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());

var messages = {
};


var user_re = "([a-z\.]+)";

app.post('/msg/', function(request, response) {
	     var msg = request.body;
	     var user;

	     console.log('Send: ' + JSON.stringify(msg));
	     if (!msg['dest']) {
		 response.send('Must specify user name', 400);
		 return;
	     }
	     
	     user = msg['dest'];

	     if (!messages[user]) {
		 messages[user] = [];
	     }
	     
	     messages[user].push(msg);
	     
	     console.log("User " + user + " now has " + messages[user].length + " messages");

	     response.send("OK");
	 });
	 

app.get('/msg/:user' + user_re, function(request, response) {
	    var msg;
	    var user;

	    console.log('Recv: ' + request.params.user);
	    user = request.params.user;
	    
	    if (!messages[user]) {
		response.send("No messages", 404);
		return;
	    }

	    if (!messages[user].length) {
		response.send("No messages", 404);
		return;
	    }

	    msg = messages[user].pop();

	    console.log("User " + user + " now has " + messages[user].length + " messages");
	    
	    console.log("Returning message " + JSON.stringify(msg));

	    response.send(JSON.stringify(msg));
	});

app.post('/reset', function(request, response) {
	     messages = {};
	     
	     response.send("OK");
});


var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
