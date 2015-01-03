var socketio = require('socket.io'),
	redis = require('socket.io-redis'),
	config = require('./config').Config,
	path = require('path'),
	_ = require('lodash'),
	gm = require('gm'),
	mongoose = require('mongoose'),
	schema = mongoose.Schema; // mongoose schema object for defining collections.
	


// Models
var MessageSchema = new schema({
	date : {type: Date, required: true},
	update: Date,
	title : {type: String, required: true},
	img: {},
	body: {type: String},
	author: {type:schema.ObjectId, required: true, ref:'User'}
});

MessageSchema.pre('save', function(next) {
	var b64reg = /^data:image\/(jpeg|png|gif|tiff|webp);base64,/;
	//	imgName = 'msg-' + this.title + " " + this.author; 
	if (b64reg.test(this.img) ) {
		// var format = b64reg.exec(this.producerData.logo);
// 		format = "." + format[1];
// 		if (format === '.jpeg') format = '.jpg';
//
		var base64Data = this.img.replace(/^data:image\/(jpeg|png|gif|tiff|webp);base64,/, ""),
		//	destination = path.normalize(path.join(__dirname, '../app', 'upload', 'message-board', imgName+format)),
			buff = new Buffer(base64Data, 'base64');
		
		gm(buff).resize('200', '200').toBuffer(function(err, buffer) {
			if (err) console.log(err);
			else this.img = buffer;
			next();
		});
			
	} else next();
});


MessageSchema.statics.getHistory = function(cb) {
	this.find({}).sort('-date').limit(12)
	.populate('author', 'name').lean().exec(cb);
};

var Message = mongoose.model('Message', MessageSchema);

//Controller
exports.configSocketIO = function configSocketIO(http) {
	
	var io = socketio.listen(http);
	
	io.adapter(redis({ host: config.redis.host, port: config.redis.port }));
	
	
	io.on('connection', function(socket){
		//console.log('a user connected');
		
		socket.on('disconnect', function(){
		  //console.log('user disconnected');
		});
		
		socket.on('message', function(msg) {
			//console.log('message received');
			socket.broadcast.emit('message', msg);
			
			msg.author = msg.author._id; // undo built-in population of author for saving to db
			var message = new Message(msg);
			message.save(function(err) {
				if (err) console.log(err);
			});
		});
		
		socket.on('edit message', function(msg) {
			msg.update = new Date();
			socket.broadcast.emit('edit message', msg);
			Message.findById(msg._id, function(err, message) {
				if (err) console.log(err);
				else {
					msg.author = msg.author._id; // undo built-in population of author for saving to db
					_.merge(message, msg);
					message.save(function(err) {
						if (err) console.log(err);
					});
				}
			});
		});
		
		socket.on('remove message', function(msg) {
			io.emit('remove message', msg);
			Message.findByIdAndRemove(msg._id, function(err, message) {
				if (err) console.log(err);
				//else console.log('message removed');
			});
		});
		
		
	});
	
	return io;
	
};
