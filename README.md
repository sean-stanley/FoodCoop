FoodCoop
========

Software for managing a local food co-op. This web app is built with a MEAN stack of MongoDB, Express v4, AngularJS v1.3 and Node.js


Working Features include:
-------------------------

* local user authentication and email invoicing for membership
* a page where an admin can check who has paid their membership and who hasn't
* two different sorts of users: producers, and customers
* producers can create a public profile about their operation and upload products to sell
* a store lists all the products and provides more details for working out the items
* a contact form for contacting the administrators or another producer about their products.

Features that are currently a work in progress:
-----------------------------------------------

* allow producers to manage previously uploaded products.
* shopping carts (currently the carts are populated with mock data)
* invoices for producers that list all the products ordered from them by all producers in a set time period.
* event scheduling for resetting carts and order processing at the end of order week.
* schedule mass email reminders about important co-op dates.
* improve UX for mobile and tablet users.


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