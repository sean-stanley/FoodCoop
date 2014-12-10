var socketio = require('socket.io');

exports.configSocketIO = function configSocketIO(http) {
	
	var io = socketio.listen(http);
	
	io.on('connection', function(socket){
	  // console.log('a user connected');
	});
	
	// message board
	
	return io;
	
	
}
