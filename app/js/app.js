'use strict';


// Declare app level module which depends on filters, and services
angular.module('co-op', [ 'ngRoute', 'co-op.filters', 'co-op.services', 'co-op.directives', 'co-op.controllers', 'ngAnimate',]).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', {templateUrl: 'partials/index-content.html', controller: 'MyCtrl1'});
    $routeProvider.when('/signup', {templateUrl: 'partials/signup.html', controller: 'userCtrl'});
    $routeProvider.when('/product-upload', {templateUrl: 'partials/product-upload.html', controller: 'productUpload'});
    $routeProvider.when('/producer-profile', {templateUrl: 'partials/edit-producer-profile.html', controller: 'producerCtrl'});
    $routeProvider.when('/contact', {templateUrl: 'partials/contact.html', controller: 'contactCtrl'});
    $routeProvider.otherwise({redirectTo: '/home'});
  }]);
