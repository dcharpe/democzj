let mongoose = require('mongoose');

// Inventory Schema
let inventory = mongoose.Schema({
	year: {
		type: Number	
	}, 
	vin:{
		type: String, 
		required: true
	}, 
	make:{
		type: String	
	}, 
	model:{
		type: String	
	}, 
	img:{
		type: String	
	}, 
	imgtwo:{
		type: String	
	}, 
	imgthree:{
		type: String	
	}, 
	imgfour:{
		type: String	
	}, 
	imgfive:{
		type: String	
	}, 
	feature:{
		type: String	
	}, 
	price:{
		type: String	
	}, 
	color:{
		type: String	
	}, 
	type:{
		type: String	
	}, 
	condition:{
		type: String	
	}, 
	certified:{
		type: String	
	}, 
	seller:String, 
	payment:String,
	hide: String,
	zip: Number	
	
});

let Inventory = module.exports = mongoose.model('Inventory', inventory, 'inventory');