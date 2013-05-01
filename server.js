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

//db object used to save tasks
var db = [
	{_id:1, title: 'New task', checked: false},
	{_id:2, title: 'New task 2', checked: true}
];

io.sockets.on('connection', function (socket) {
	
	/**
   	* task:create
   	*
   	* called when we .save() our new task
   	*
   	* we listen on model namespace, but emit
   	* on the collection namespace
   	*/
	socket.on('task:create', function (data, callback) {
		data._id = db.length + 1;
		db.push(data);

		//send task to the client
		socket.emit('tasks:create', data);

		//send task to the other clients
		socket.broadcast.emit('tasks:create', data);
		callback(null, data);
	});

	/**
   	* task:read
   	*
   	* called when we .fetch() our collection
   	* in the client-side router
   	*/
	socket.on('tasks:read', function (data, callback) {
		console.log('callback!', callback);
		callback(null, db);
	});

	/**
   	* task:delete
   	*
   	* called when we .destroy() our model
   	*/

   	socket.on('task:delete', function (data, callback) {
   		
   		var dbId = data._id - 1;
   		var json = db[dbId];

   		socket.emit('task/' + data._id + ':delete', json);
   		socket.broadcast.emit('task/' + data._id + ':delete', json);
   		callback(null, json);

   		console.log('yooooooooooooo',json);
   		console.log('yooooooooooooo',data._id);

   		db.splice(dbId, 1);
   	});

   });