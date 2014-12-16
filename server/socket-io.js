var socketio = require('socket.io');

exports.configSocketIO = function configSocketIO(http) {
	
	var io = socketio.listen(http);
	
	io.on('connection', function(socket){
		console.log('a user connected');
		socket.on('disconnect', function(){
		  console.log('user disconnected');
		});
		socket.on('message', function(msg) {
			io.emit('message', msg);
		})
	});
	
	// message board
	return io;
	
	
}
