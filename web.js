var express = require('express');
var app = express();

app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());

var engines = require('consolidate');
app.engine('html',engines.jqtpl);
app.set('view options',{layout:false});

var index = 0;

var messages = {
};


var user_re = "([a-z\.0-9]+)";

app.post('/msg/', function(request, response) {
  var msg = request.body;
  var user;

  console.log('Send: ' + JSON.stringify(msg));
   if (!msg['dest']) {
    console.log("User name not specified");
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

app.get('/reset', function(request, response) {
  messages = {};
  response.send("OK");
});

app.get("/mozdemoa/:user" + user_re + "/:target" + user_re, function(request, response) {
  var params = {
    me: request.params.user,
    them: request.params.target,
    start: false
  };

  response.render("mozdemo.html", params);
});

app.get("/mozdemoc/:user" + user_re + "/:target" + user_re, function(request, response) {
  var params = {
    me: request.params.user,
    them: request.params.target,
    start: true
  };

  response.render("mozdemo.html", params);
});

app.get("/mozdemo", function(request, response) {
  var to_uri = "/mozdemoa/" + ++index + "/" + ++index;
  response.redirect(to_uri);
});

/* ID Demo. TODO: refactor so this is not duplicated */
app.get("/mozdemoida/:user" + user_re + "/:target" + user_re, function(request, response) {
  var params = {
    me: request.params.user,
    them: request.params.target,
    start: false
  };
  response.render("mozdemoid.html", params);
});

app.get("/mozdemoidc/:user" + user_re + "/:target" + user_re, function(request, response) {
  var params = {
    me: request.params.user,
    them: request.params.target,
    start: true
  };
  response.render("mozdemoid.html", params);
});

app.get("/mozdemoid", function(request, response) {
  var to_uri = "/mozdemoida/" + ++index + "/" + ++index;
  response.redirect(to_uri);
});

app.get("/offer_answer", function(request, response) {
	    response.render("offer_answer.html", {});
});


var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
