# Natural Food Co-op


Software for managing a local food co-op. This web app is built with MongoDB, Express, AngularJS and Node.js.

A live site can be found [here](https://foodcoop.nz).


# Included Features:


## Sign Up

Joining the co-op store is easy and secure.
A potential member can join either as a producer member or customer member. The main differences being producers have a public producer profile to manage and can upload products for sale in the store. Both producer and customer members can shop in the store.

## Buying Products

To ease transportation costs buying is done on a fixed and customizable schedule in our dynamic and powerful store with an intuitive shopping cart.

### Schedule
The admin page lets an admin user create new ordering cycles by specifying a start date (and time though this is usually midnight local time), shopping start, shopping stop and delivery day.

Here is what each of those controls in the store:

**Start** signifies the start of the cycle and must be unique though can overlap with shopping start. This date sets the default cycle for uploading products.

**Shopping Start** to **Shopping Stop** control when a user can and cannot shop for that cycle. Adding items to the shopping cart outside of the shopping start and shopping end date range is forbidden. The Shopping Stop event triggers invoicing customers for items in their cart and sending delivery requests to producers. Checkout, thus is automatic.

**Delivery Day** is when producers bring all their goods to a central location for sorting and packing and for customers to either pick up or be sent out to more remote customers.

### Store
The store by default only shows products uploaded for sale for the current cycle. It contains an easy-to-use interface as well as various search and filtering controls.

### Shopping Cart
A one-click add-to-cart system is in place and there is no checkout necessary. Once an item is added to a user's cart they can change the quantity they wish to purchase, quick-link to reading more about the product again or delete the product entirely from their cart.

Cart's are only mutable between the shopping start and shopping stop dates as the customer is invoiced when the Shopping Stop event is triggered.

## Selling Products
A producer is very flexible with the ability to sell products through the store. They set their own prices (the co-op adds a markup though that can be set in the server/coopConfig.js file), units and quantity available. They also have a [Textangular Wysywig Editor](https://github.com/fraywing/textAngular) for making a rich product description.

A product image can be uploaded and cropped in the browser with Standup75's [Angular Cropme Directive](https://github.com/standup75/cropme).

A producer chooses when to sell the product and a single product can be replicated across multiple cycles with a single click. Each product can be individually updated as well.

## Managing Products and Orders
A producer can see details for each order made and products they've sold in the store and have some very useful statistics at their finger tips.

* Total number of products sold
* Most Popular Product
* Most frequent customer
* Customer that spent the most
* Best cycle for sales

All these statistics can be confined within start and end dates for greater analysis.

## Invoices
A producer receives an invoice from the co-op on behalf of customers and these are marked as income while purchases are invoiced to a buyer and need to be paid.

Invoices are flagged by status: Paid, un-paid, overdue, cancelled, to be refunded.

An admin can see all invoices while a user can see just the ones for them.

If a user has credit, it is automatically factored into their purchases invoice or their product's purcahsed invoice for a producer member.

Invoices can be paid by internet banking or credit card with [txtpay](https://txtpay.co.nz).

## Message Board
A real-time message board feature allows users to post community bulletins, recipies, requests, etc.

## Producer List and Profiles
People care about where their food comes from, so the co-op gives a way for site visitors to meet the producers. Our directory lists producers and links to their profile pages. A producer can customize their profile with a logo, contact details, and a rich content company description and bio. A google map showing their address is available for producers wishing to make their business address easily available.

## Admin Tools
Admin tools exists for managing most co-op features.

* Manage Users and their permissions. An admin can initialize a password reset for a user but can't change their password specifically.
* See all orders for a specific cycle. The orders are listed by producer, by customer and by refrigeration/frozen needs.
* Create and edit order cycles.
* See all invoices and change their status (from un-paid to paid for example)


# Future Feature Ideas:

* Add more E2E tests for common user tasks
* Add more unit tests for both client-side and server-side controllers
* Add a way to manage mailchimp subscription right from our site.
* (When more meat sellers join) when a member buys an animal that must be butchered, have the website provide a form for filling out butchery instructions.
* have a live map showing markers where producers live on producer list page. Currently lat long data is already stored for users.
* for Co-op presentations and promotional/educational events have a place for those to be promoted on the website
* move the farmer's market map from the blog to the main website
* list other sources for local food in Northland
* (When more meat sellers join) make a note that whole beast sales are not handled on delivery day but upon arrangement with the producer.
* Develop a list of regions that members can belong to and then filter shopping to their regions. This would allow multiple regions to buy at the same time or possibly on different schedules.
* integrate a method of searching for producers near a member.

# Want to Fork or Try Out?

Dependencies:

* Node.js v0.10 or later
* Mongodb v2.6 or later
* Redis v2.8 or later

You need to have node.js installed on your machine to run the site. We develop on 0.10 so if you run into issues, try using that version.

Install the necessary modules:

    npm install -g grunt-cli
    npm install

Run Mongodb

    mongod

Then install sample data from the database with

    mongorestore dump

This will give you access to a collection of sample users, sample products, categories and certification types.

To install the client-side dependencies we've used Bower.

	bower install


Developing
==========

To start the server:

    grunt dev | bunyan

Then go to localhost:4001 to see the site.

Configuring
===========

Browser-based Admin tools exist for most major aspects of running a co-op.

To edit most other options edit the variables in server/coopConfig.

You'll also need to create a config.js file or edit the emailer.js file to use your own gmail credentials.


