var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var bcrypt = require('bcryptjs');
var passport = require('passport');
var config = require('./config/database');
var  stripe = require("stripe")("sk_test_roAqqMvJPmnaNpXdPPrOhm15009Dhs7uvZ");

mongoose.Promise = global.Promise;
mongoose.connect(config.database, { useNewUrlParser: true });
var fs = require('fs');
var Schema = mongoose.Schema;
var multer = require('multer');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', ()=>{ 
	console.log('Connected to Carzam Database!'); 
});

let Inventory = require('./models/inventory');
let User = require('./models/user');
//let Item = require('./models/item');

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
	secret: 'nunyabuznas',
	resave: true,
	saveUninitialized: true
}));

app.use(require('connect-flash')());
app.use(function(req, res, next){
	res.locals.messages = require('express-messages')(req, res);
	next();
});

app.use(expressValidator({
	errorFormatter: function(param, msg, value){
		var namespace = param.split('.'),
		root = namespace.shift(),
		formParam = root;
		while(namespace.length){
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			param : formParam,
			msg : msg,
			value : value
		};
	}
}));
// Static CSS and JS
app.use(express.static('./public'));

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

var storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()+ path.extname(file.originalname));
    }
})

var upload = multer({ 
	storage: storage, 
	limits: {fileSize:1000000},
	fileFilter: function(req, file, cb){
		checkFileType(file, cb);
	}
}).single('photo');

function checkFileType(file, cb){
	var filetypes = /jpeg|jpg|png|gif/;
	var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	var mimetype = filetypes.test(file.mimetype);
	if(mimetype && extname){
		return cb(null, true);
	} else {
		cb('Image or PDF only');
	}
}

app.post('/fileUpload/:id', upload ,function(req,res){
	upload(req, res, (err)=>{
		if(err){
			res.render('fileUpload', {
				msg: err
			});
		} else {
			if(req.file == undefined){
				res.render('fileUpload', {
					msg: 'Error: No File Selected'
				});
			} else {
				var fullPath = "uploads/"+req.file.filename;
				let inventory = {};
				inventory.img = fullPath;
				let query = {_id:req.params.id}
				Inventory.update(query, inventory, (err)=>{
					if(err){
						console.log(err);
						return;
					} else {
						res.redirect('/dashboard');
					}
				});
			}
		}
	});
});
app.get('/fileUpload/:id', function(req, res) {
	Inventory.findById(req.params.id, (err, inventory)=>{
		res.render('fileUpload', {
			inventory: inventory
		});
	});
});

app.get('*', (req, res, next)=>{
	res.locals.user = req.user || null;
	next();
});
// Landing Page
app.get('/', (req, res)=>{
	Inventory.find({}, (err, inventories)=>{
		User.find({}, (err, users)=>{
		if(err){
			console.log(err);
		} else {
			res.render('index', {
				inventories: inventories,
				users: users
			});
		}
	});	
	});
});
app.get('/single/:id', (req, res)=>{
	let query = {_id:req.params.id}
	Inventory.findById(query, (err, inventories)=>{
		User.findById(inventories.seller, (err, users)=>{
		res.render('single', {
			inventories: inventories,
			seller: users.username
		});
	});
	});
});
app.get('/partner', function(req, res) {
	res.render('login');
});
app.get('/dashboard', ensureAuthenticated, (req, res)=>{
	Inventory.find({}, (err, inventories)=>{
		User.find({}, (err, users)=>{
			if(err){
				console.log(err);
			} else {
				res.render('dashboard', {
					inventories: inventories,
					users: users
				});
			}
		});
	});
});
app.get('/add', ensureAuthenticated, (req, res)=>{
	res.render('add');
});
app.post('/add', ensureAuthenticated, (req, res) =>{
	let inventory = new Inventory();
	inventory.vin = req.body.vin;
	inventory.year = req.body.year;
	inventory.make = req.body.make;
	inventory.model = req.body.model;
	inventory.price = req.body.price;
	inventory.color = req.body.color;
	inventory.type = req.body.type;
	inventory.zip = req.body.zip;
	inventory.feature = req.body.feature;
	inventory.seller = req.user._id;
	inventory.save((err)=>{
		if(err){
			console.log(err);
			return;
		} else {
			req.flash('success', 'Inventory Added Successfully!');
			res.redirect('/dashboard');
		}
	});
});
app.get('/edit/:id', (req, res)=>{
	Inventory.findById(req.params.id, (err, inventory)=>{
		res.render('edit', {
			inventory: inventory
		});
	});
	
});
app.post('/edit/:id', (req, res) =>{
	let inventory = {};
	inventory.year = req.body.year;
	inventory.make = req.body.make;
	inventory.model = req.body.model;
	inventory.price = req.body.price;
	inventory.color = req.body.color;
	inventory.type = req.body.type;
	inventory.zip = req.body.zip;
	inventory.feature = req.body.feature;
	let query = {_id:req.params.id}
	Inventory.update(query, inventory, (err)=>{
		if(err){
			console.log(err);
			return;
		} else {
			res.redirect('/dashboard');
		}
	});
});
app.get('/delete/:id', (req, res)=>{
	Inventory.findById(req.params.id, (err, inventories)=>{
		res.render('delete', {
			inventories: inventories
		});
	});
	
});
app.post('/delete/:id', (req, res)=>{
	let query = {_id:req.params.id};
	Inventory.remove(query, (err)=>{
		if(err){
			console.log(err);
		} else {
			res.redirect('/dashboard');
		}
	});
});
app.get('/payment/:id', (req, res)=>{
	Inventory.findById(req.params.id, (err, inventory)=>{
		res.render('payment', {
			inventory: inventory
		});
	});
	
});
app.post('/payment/:id', (req, res) =>{
	var amount = 1000;
	stripe.customer.create({
		email: req.body.stripeEmail,
		source: req.body.stripeToken

	}).then(customer => stripe.charges.create({
		amount,
		desription: "Purchasing a post space",
		currency: "usd",
		customer: customer.id
	})).
	then(charge => res.render('success'))
	var token = req.body.stripeToken;
	var chargeAmount = req.body.chargeAmount;
	

}); 
app.get('/register', (req, res)=>{
		res.render('register');
});
app.post('/register', function(req, res){
	const firstName = req.body.firstName;
	const lastName = req.body.lastName;
	const username = req.body.username;
	const password = req.body.password;
	const confirmpassword = req.body.confirmpassword;
	
	req.checkBody('firstName', 'First Name is required').notEmpty();
	req.checkBody('lastName', 'Last Name is required').notEmpty();
	req.checkBody('username', 'Email is required').notEmpty();
	req.checkBody('username', 'Email is not valid').isEmail();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('confirmpassword', 'Passwords do not match').equals(req.body.password);
	
	let errors = req.validationErrors();
	
	if(errors){
		res.render('register', {
			errors:errors
		});
	} else {
		let newUser = new User({
			firstName:firstName,
			lastName: lastName,
			username:username,
			password:password
		});
		bcrypt.genSalt(10, function(err, salt){
			bcrypt.hash(newUser.password, salt, function(err, hash){
				if(err){
					console.log(err);
				}
				newUser.password = hash;
				newUser.save(function(err){
					if(err){
						console.log(err);
						return;
					} else {
						req.flash('success', 'You have successfully registered and can log in');
						res.redirect('/login');
					}
				});
			});
		});
	}
});

app.get('/login', function(req, res) {
	res.render('login');
});
app.post('/login', function(req, res, next) {
	User.find({}, (err, users)=>{
		passport.authenticate('local', {
			successRedirect: '/dashboard',
			failureRedirect: '/login',
			failureFlash: true
		})(req, res, next);
	});

});
app.get('/logout', function(req, res){
	req.logout();
	req.flash('success', 'You are logged out');
	res.redirect('/');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('Please login');
		res.redirect('/login');
	}
}

// Server
app.listen(port, () => {
	console.log('Server listening on port:', port);
});