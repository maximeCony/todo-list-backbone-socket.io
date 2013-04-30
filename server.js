var express = require('express')
,app = express()
, server = require('http').createServer(app)
, io = require('socket.io').listen(server);

//global configuration
app.configure(function(){

	// serve static files
	app.use("/", express.static(__dirname + '/app'));
});

server.listen(80);

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

var db = [
	{_id:1, title: 'New task', checked: false},
	{_id:2, title: 'New task 2', checked: true},
];

io.sockets.on('connection', function (socket) {
	
	socket.on('task:create', function (data, callback) {
		data._id = db.length + 1;
		db.push(data);

		//send task to the client
		socket.emit('tasks:create', data);

		//send task to the other clients
    	socket.broadcast.emit('tasks:create', data);
    	callback(null, data);
	});

	socket.on('tasks:read', function (data, callback) {
		console.log('callback!', callback);
		callback(null, db);
	});

});