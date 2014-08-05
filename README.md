FoodCoop
========

Software for managing a local food co-op. This web app is built with a MEAN stack of MongoDB, Express v4, AngularJS v1.3 and Node.js

Features include: 

* local user authentication and email invoicing for membership
* two different sorts of users: producers, and customers
* producers can create a public profile about their operation and upload products to sell
* a store lists all the products for sale currently
* cart and order management (under development)

Setting Up
==========
You need to have node.js installed on your machine to run the site.

We hope before long to have a live demo available online. Just waiting on the man with the server to give me access really.

Install the necessary modules:

    npm install -g grunt-cli
    npm install

Run Mongodb

    mongod

Then install sample data from the database with

    mongorestore dump

This will give you access to a collection of sample users, sample products, categories and certification types.

You may also need to go to the app/lib directory where the bower components are stored and run

	bower install
or 

	bower update


Developing
==========

To start the server:

    grunt dev

Then go to localhost:8081 to see the site.