var express = require('express');

var app = express.createServer(express.logger());
app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());
app.register('.html',require('jqtpl').express);
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

app.post('/reset', function(request, response) {
  messages = {};
  response.send("OK");
});

app.get('/', function(request, response) {
  var local_src = "/static/js";
  var svn_src = "http://svn.resiprocate.org/rep/ietf-drafts/fluffy/roap_demo";
  var params = {
    peerconnection_src:local_src,
    test_src:local_src
  };

  console.log(request.query);

  if (request.query['pc'] === "svn" ){
    console.log("Using peerconnection from svn");
    params.peerconnection_src = svn_src;
  }

  if (request.query['test'] === "svn"){
    params.test_src = svn_src;    
  }

  console.log(params);
  response.render("demo.html", params);
});

app.get("/mozdemoa/:user" + user_re + "/:target" + user_re, function(request, response) {
  var params = {
    me: request.params.user,
    them: request.params.target,
    start:false
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

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
