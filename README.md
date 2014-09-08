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
* allow producers to manage previously uploaded products.
* shopping carts creation, restriction, modification and manipulation
* invoices for producers that list all the products ordered from them by all producers in a set time period.
* A general cycle counter that resets carts and products each ordering cycle.
* schedule mass email reminders about important co-op dates with MailChimp.

Features that are currently a work in progress:
-----------------------------------------------

* improve UX for mobile and tablet users.
* General design improvements for home page, about us page, faq page, sign up page and some others
* move the site to a live server.

Future Feature Ideas:
-----------------------------------------------

* have a live map showing markers where producers live on producer list page. Currently lat long data is already stored for users.
* Promote subscription sales for things like milk or vege boxes
* for Co-op presentations and promotional/educational events have a place for those to be promoted on the website
* move the farmer's market map from the blog to the main website
* list other sources for local food in Northland
* when a member buys an animal that must be butchered, have the website provide a form for filling out butchery instructions.
* make a note that whole beast sales are not handled on delivery day but upon arrangement with the producer.

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

Configuring
===========

CALENDAR CYCLE

The coopConfig.js file in the server directory contains static useful data for configuring a co-op. It also includes the dates that determine the co-op's ordering cycle. Different ordering cycles will require changes to these values. The datejs module is crucial for calculating these dates. If you wish to change the cycle, look at the documentation and examples [here](https://code.google.com/p/datejs/)

At the moment these values are set once each time the server is started up. Later an event will be scheduled to update these values the day after delivery day.