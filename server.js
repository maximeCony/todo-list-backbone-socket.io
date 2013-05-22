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
	{_id:1, title: 'Server - New task', checked: false},
	{_id:2, title: 'Server - New task 2', checked: true}
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

      console.log('CREATE!!!');

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
      console.log('READ!!!');
		callback(null, db);
	});

	/**
	* task:update
	*
	* called when we .save() our model
	* after toggling its completed status
	*/

	socket.on('task:update', function (data, callback) {

		console.log('DELETE!!!');
		
		var dbId = data._id - 1;
		var json = db[dbId];

		socket.emit('task/' + data._id + ':update', json);
		socket.broadcast.emit('task/' + data._id + ':update', json);
		callback(null, json);
	});

   /**
	* task:delete
	*
	* called when we .destroy() our model
	*/

	socket.on('task:delete', function (data, callback) {

		console.log('DELETE!!!');
		
		var dbId = data._id - 1;
		var json = db[dbId];

		socket.emit('task/' + data._id + ':delete', json);
		socket.broadcast.emit('task/' + data._id + ':delete', json);
		callback(null, json);

		console.log('JSON:',json);
		console.log('Data id:',data._id);

		db.splice(dbId, 1);
	});

   });