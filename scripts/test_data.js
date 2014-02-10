// app.js
var databaseUrl = "mydb"; // "username:password@example.com/mydb"
var collections = ["users","orders","products","categories","locations","certifications"];
var db = require("mongojs").connect(databaseUrl, collections);
var sample_users = [
	{
		dateJoined : '10/10/13',
		producerName : 'Lisa Taylor',
		companyName : 'Northland Naturals 2',
		companyImg : 'img/producers/lisa-taylor.JPG',
		companyLogo : 'img/producer-logos/northland%20naturals%20logo.png',
		description : 'I sell fruits and vegetables grown organically in deep, rich volcanic soil in Whangarei. They are so fresh and tasty',
		email : 'lisa@maplekiwi.com',
		phone : '0212534669',
		address : '104/148 Corks Rd, Tikipunga Whangarei, 0221',
		certification : 'Assure Quality',
		feedbackScore : 4,
		user_type : 'Producer'
	},
	{
		dateJoined : '9/9/13',
		producerName : 'Rosie Boom',
		companyName : 'Boom Jams',
		companyImg : 'img/producers/rosie-boom.JPG',
		companyLogo : '',
		description : 'Hi, I\'m Rosie Boom. I write children\'s books about homesteading and homeschooling in New Zealand. I sell home made jams and preserves made from our fruit trees. They are fantastic. Try some!',
		email : 'boomfamily@xtra.co.nz',
		phone : '0274376677',
		address : 'Kara Road, Maungatepere Whangarei',
		certification : 'none',
		feedbackScore : 3,
		user_type : 'Producer'
	},
	{
		dateJoined : '8/8/13',
		producerName : 'Michael Taylor',
		companyName : 'Assistant Fig Keeper',
		companyImg : 'img/producers/michael-taylor.JPG',
		companyLogo : '',
		description : 'I keep figs! I\'ve got figs to sell! Isn\'t that great? Sean is really good at webdesign don\'t you think?',
		email : 'michael@maplekiwi.com',
		phone : '0210699472',
		address : '104/148 Corks Rd, Tikipunga Whangarei, 0221',
		certification : 'Demeter Biodynamics',
		feedbackScore : 1,
		user_type : 'Producer'
	},
	{
		dateJoined : '7/7/13',
		producerName : 'Matt Stanley',
		companyName : 'Northland Naturals',
		companyImg : 'img/producers/matt-stanley.JPG',
		companyLogo : 'img/producer-logos/northland%20naturals%20logo.png',
		description : 'Northland Naturals is an organic permacultural centre in Whangarei. We grow on our 11 acre block all varieties of fruit and vegetables and have been feeding families since 2012.',
		email : 'matt@maplekiwi.com',
		phone : '02040094128',
		address : '71 Lauries Drive, Kamo Whangarei',
		certification : 'Organic Farm NZ',
		feedbackScore : 5,
		user_type : 'Producer'
	}
]
var sample_products =
	[{
		dateUploaded: '24/9/13',
		category: 'Baked Goods',
		productName: 'Buns',
		variety: 'Whole Wheat',
		price: 3.5,
		quantity: 10,
		units: 'dozen',
		refrigeration: 'refrigeration',
		ingredients: 'whole wheat, water, poppy seeds, sunflower seeds, sesame seeds, sugar, oil, yeast, salt',
		description: 'Freshly baked buns topped with a delcious variety of seeds. The buns were baked in Kerikeri by loving hands. The hands in question were washed very thouroughly and covered in latex gloves during the entire baking process.',
		certification: 'biogro',
		producerName: 'Jane Blank',
		producerCompany: 'Fun Buns'
	},
	{
		dateUploaded: '24/10/13',
		category: 'Produce',
		productName: 'Grapefruit',
		variety: 'Pink',
		price: 2.5,
		quantity: 25,
		units: 'kg',
		refrigeration: 'none',
		ingredients: null,
		description: 'These delicious pink grapefruit were grown in Whangarei without any artificial fertilier, insecticides or herbicides. In fact, every morning we get up and sing to the tree and ask the fey spirits to bless it and make it bountiful. It worked I think as we have more fruit now than my family can eat.',
		certification: 'assure-quality',
		producerName: 'Matt Stanley',
		producerCompany: 'Northland Naturals'
	},
	{
		dateUploaded: '12/11/13',
		category: 'Meat',
		productName: 'Sausages',
		variety: 'Gluten-Free',
		price: 12.5,
		quantity: 10,
		units: 'kg',
		refrigeration: 'frozen',
		ingredients: 'Organic pork, gluten-free breadcrumbs, salt, spices, smoke, tender-loving care',
		description: 'These delicious pink grapefruit were grown in Whangarei without any artificial fertilier, insecticides or herbicides. In fact, every morning we get up and sing to the tree and ask the fey spirits to bless it and make it boutiful. It worked I think as we have more fruit now than my family can eat.',
		certification: 'none',
		producerName: 'Butch Jock',
		producerCompany: 'Butch Butcher'
	},
	{
		dateUploaded: '2/11/13',
		category: 'Dairy',
		productName: 'Yoghurt',
		variety: 'Raw',
		price: 4,
		quantity: 20,
		units: 'L',
		refrigeration: 'refrigeration',
		ingredients: 'raw milk, culture',
		description: 'Raw Milk certified Demeter, made in Waipu',
		certification: 'dem-organics',
		producerName: 'Stan',
		producerCompany: 'Salmon Road Dairy Farm'
	},
	{
		dateUploaded: '7/11/13',
		category: 'Raw Milk',
		productName: 'Goat Milk',
		variety: 'Raw',
		price: 2,
		quantity: 100,
		units: 'L/week for 4 weeks',
		ingredients: 'milk',
		refrigeration: 'refrigeration',
		description: 'Raw Goats Milk certified Organic Farm NZ. Goats raised naturally in Tutukaka.',
		certification: 'organicfarmnz',
		producerName: 'Klaus Lotz',
		producerCompany: 'Tutukaka Organics'
	}];
for (i=0; i<sample_users.length; i++){
	db.users.save(sample_users[i], function(err, saved) {
		if( err || !saved ) console.log("User not saved");
		else console.log("User saved");
	});
};
for (i=0; i<sample_products.length; i++){
	db.products.save(sample_products[i], function(err, saved) {
		if( err || !saved ) console.log("Product not saved");
		else console.log("Product saved");
	});
};
db.users.find(function(err, results){
	console.dir(results);
})
db.products.find(function(err, results){
	console.dir(results);
})