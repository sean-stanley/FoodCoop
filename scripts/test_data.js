#!/usr/bin/env node

var mongoose = require('mongoose');
var models = require('../server/models.js');
mongoose.connect('mongodb://localhost/mydb');
var db = mongoose.connection;
passport = require('passport'),
LocalStrategy = require('passport-local').Strategy;
/*
var sample_users = [

	{
		dateJoined: Date.now(),
		name: 'Lisa Taylor',
		producerData: {
			companyName: 'Northland Naturals 2',
			companyImg: 'img/producers/lisa-taylor.JPG',
			companyLogo: 'img/producer-logos/northland%20naturals%20logo.png',
			description: 'I sell fruits and vegetables grown organically in deep, rich volcanic soil in Whangarei. They are so fresh and tasty',
			feedbackScore: 4
		},
		email: 'lisa@maplekiwi.com',
		phone: '0212534669',
		address: '104/148 Corks Rd, Tikipunga Whangarei, 0221',
		user_type: {
			name: "Producer",
			canBuy: true,
			canSell: true
		}
	}, {
		dateJoined: Date.now(),
		name: 'Rosie Boom',
		producerData: {
			companyName: 'Boom Jams',
			companyImg: 'img/producers/rosie-boom.JPG',
			companyLogo: '',
			feedbackScore: 3,
			description: 'Hi, I\'m Rosie Boom. I write children\'s books about homesteading and homeschooling in New Zealand. I sell home made jams and preserves made from our fruit trees. They are fantastic. Try some!'
		},

		email: 'boomfamily@xtra.co.nz',
		phone: '0274376677',
		address: 'Kara Road, Maungatepere Whangarei',

		user_type: {
			name: "Producer",
			canBuy: true,
			canSell: true
		}
	}, {
		dateJoined: Date.now(),
		name: 'Michael Taylor',
		email: 'michael@maplekiwi.com',
		phone: '0210699472',
		address: '71 Lauries Drive, RD1 Kamo, 0185',
		user_type: {
			name: "Customer",
			canBuy: true,
			canSell: false
		}

	}, {
		_id: 0,
		dateJoined: Date.now(),
		name: 'Matt Stanley',
		producerData: {
			companyName: 'Northland Naturals',
			companyImg: 'img/producers/matt-stanley.JPG',
			companyLogo: 'img/producer-logos/northland%20naturals%20logo.png',
			feedbackScore: 5,
			description: 'Northland Naturals is an organic permacultural centre in Whangarei. We grow on our 11 acre block all varieties of fruit and vegetables and have been feeding families since 2012.'
		},
		email: 'matt@maplekiwi.com',
		phone: '02040094128',
		address: '71 Lauries Drive, Kamo Whangarei',
		user_type: {
			name: "Producer",
			canBuy: true,
			canSell: true
		}

	}
]*/




/*
var sample_certifications = [
	{
		name: 'none',
		img: ''
	},
	{
		name: 'Assure Quality',
		img: 'assure-quality.png'
	},
	{
		name: 'BioGro',
		img: 'biogro.png'
	},
	{
		name: 'Demeter Biodynamics',
		img: 'demgreen.gif'
	},
	{
		name: 'Organic Farm NZ',
		img: 'organicfarmnz.png'
	},
	{
		name: 'In Transition',
		img: ''
	}
]*/


var sample_categories = [
	{
	name:'Produce',
	placeholderName: 'Apples',
	placeholderVariety: 'Granny Smith',
	availableUnits: ['kg', 'g', '10kg', 'bag', 'punnet', 'bucket', 'bunch', 'crate', 'pallet', 'unit'],
},
	{
		name:'Processed-Goods',
		placeholderName: 'Jam',
		placeholderVariety: 'Strawberry',
		availableUnits: ['kg', 'g', '10kg', 'L', '750ml', 'jar', 'bottle', 'unit'],
	},
	{
		name:'Baked Goods',
		placeholderName: 'Bread',
		placeholderVariety: 'Gluten-Free',
		availableUnits: ['kg', 'loaf', 'dozen', 'baker\'s dozen', 'package', 'unit'],
	},
	{
		name:'Meat',
		placeholderName: 'Sausages',
		placeholderVariety: 'Beef',
		availableUnits: ['kg', 'loaf', 'dozen', 'whole beast', 'half beast', 'package', 'unit'],
	},
	{
		name:'Milk',
		placeholderName: 'Goat Milk',
		placeholderVariety: 'Raw',
		availableUnits: ['L', '500ml'],
	},
	{
		name:'Dairy & Eggs',
		placeholderName: 'Yoghurt',
		placeholderVariety: 'Manuka Honey',
		availableUnits: ['L', '500ml', 'litres per week', 'litres biweekly', '250ml jar', 'dozen', '1/2 dozen', 'tray', 'pound', 'kg'],
	}
]


/*
var sample_products = [
{
	dateUploaded: Date('24/9/14'),
	productName: 'Buns',
	variety: 'Whole Wheat',
	price: 3.5,
	quantity: 10,
	units: 'dozen',
	refrigeration: 'refrigeration',
	ingredients: 'whole wheat, water, poppy seeds, sunflower seeds, sesame seeds, sugar, oil, yeast, salt',
	description: 'Freshly baked buns topped with a delcious variety of seeds. The buns were baked in Kerikeri by loving hands. The hands in question were washed very thouroughly and covered in latex gloves during the entire baking process.',
	img: 'buns.jpg'
}, 
{
	dateUploaded: Date('24/9/14'),
	productName: 'Jam',
	variety: 'Strawberry',
	price: 4.5,
	quantity: 4,
	units: 'dozen',
	refrigeration: 'refrigeration',
	ingredients: 'strawberries, raw sugar, pectin',
	description: 'Freshly baked buns topped with a delcious variety of seeds. The buns were baked in Kerikeri by loving hands. The hands in question were washed very thouroughly and covered in latex gloves during the entire baking process.',
	img: 'buns.jpg'
},
{
	dateUploaded: Date('24/10/14'),
	productName: 'Grapefruit',
	variety: 'Pink',
	price: 2.5,
	quantity: 25,
	units: 'kg',
	refrigeration: 'none',
	ingredients: null,
	description: 'These delicious pink grapefruit were grown in Whangarei without any artificial fertilier, insecticides or herbicides. In fact, every morning we get up and sing to the tree and ask the fey spirits to bless it and make it bountiful. It worked I think as we have more fruit now than my family can eat.',
	img : 'grapefruit.jpg'
}, {
	dateUploaded: Date('12/11/14'),
	productName: 'Sausages',
	variety: 'Gluten-Free',
	price: 12.5,
	quantity: 10,
	units: 'kg',
	refrigeration: 'frozen',
	ingredients: 'Organic pork, gluten-free breadcrumbs, salt, spices, smoke, tender-loving care',
	description: 'These delicious pink grapefruit were grown in Whangarei without any artificial fertilier, insecticides or herbicides. In fact, every morning we get up and sing to the tree and ask the fey spirits to bless it and make it bountiful. It worked I think as we have more fruit now than my family can eat.',
	img : 'sausages.jpg'
}, {
	dateUploaded: Date('2/11/13'),
	productName: 'Yoghurt',
	variety: 'Raw',
	price: 4,
	quantity: 20,
	units: 'L',
	refrigeration: 'refrigeration',
	ingredients: 'raw milk, culture',
	description: 'Raw Milk certified Demeter, made in Waipu',
	img : 'yogurt-tawar.jpg'
}, {
	dateUploaded: Date('7/11/13'),
	productName: 'Goat Milk',
	variety: 'Raw',
	price: 2,
	quantity: 100,
	units: 'L/week for 4 weeks',
	ingredients: 'milk',
	refrigeration: 'refrigeration',
	description: 'Raw Goats Milk certified Organic Farm NZ. Goats raised naturally in Tutukaka.',
	img : 'milk.jpg'
}];
*/

/*
for (i = 0; i < sample_users.length; i++) {
	models.User.register(new models.User(sample_users[i]), "asdf", function(err, account) {
		passport.authenticate('local')
		console.log(err)
	})
};
for (i = 0; i < sample_products.length; i++) {
	new models.Product(sample_products[i]).save(function(err) {
		if (err) console.log(err);
		console.dir("Product saved")
	});
};

for (i = 0; i < sample_certifications.length; i++) {
	new models.Certification(sample_certifications[i]).save(function(err) {
		if (err) console.log(err);
		console.dir("Certification saved")
	});
};
*/

for (i = 0; i < sample_categories.length; i++) {
	new models.Category(sample_categories[i]).save(function(err) {
		if (err) console.log(err);
		console.dir("Category saved")
	});
};
