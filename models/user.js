let mongoose = require('mongoose');


var UserSchema = mongoose.Schema({

	firstName:{
		type: String,
		required: true
	},
	lastName:{
		type: String,
		required: true
	},
	username:{
		type: String,
		required: true,
		index: { 
			unique: true,
			sparse: true 
		}
	},
	password:{
		type: String,
		required: true
	},
	role:{
		type: String
	},
	verify:{
		type: String
	}
});


var User = module.exports = mongoose.model('User', UserSchema, 'user');