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

Install the necessary modules:

    npm install -g grunt-cli
    npm install

Run Mongodb

    mongod

Then install sample data from the database with

    mongorestore dump

This will give you access to a collection of sample users, sample products, categories and certification types.

Developing
==========

To start the server:

    grunt dev
