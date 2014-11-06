'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */
describe('food coop common user tasks', function() {
	
	
	describe('food coop signup', function() {
		beforeEach(function() {
		  browser.get('http://localhost:4001/signup');
		});
			
			it('should have the company name as the title', function() {
		    expect(browser.getTitle()).toBe('Signup - Northland Natural Food Co-op');
		  });
		
		  it('should render signup page when user navigates to /signup', function() {
		    expect(element(by.css('[ng-view]')).element(by.css('.page-header')).getText()).
		      toMatch(/Sign Up/i);
		  });
		});
	

	describe('logging in', function() {

		beforeEach(function() {
		  browser.get('http://localhost:4001/login-page');
		});
		
		it('should login the test user successfully', function() {
			element(by.css('[ng-view]')).element(by.model('loginData.email')).sendKeys('sean@foodcoop.org.nz');
			element(by.css('[ng-view]')).element(by.model('loginData.password')).sendKeys('welcome123');
			element(by.css('[ng-view]')).element(by.buttonText('Sign in')).click();

			expect(element(by.css('.alert-success')).getText()).toEqual("Welcome back Sean Stanley. Please click on 'member tools' on the left side of the top tool bar to get started. Mobile and tablet users tap the top left grey arrow.");
			
			element(by.cssContainingText('.navbar-brand', 'Member Tools')).click();
			
			
			$('[href="product-upload"]').click();
			expect(browser.getLocationAbsUrl()).toEqual('http://localhost:4001/product-upload-401')
			
		})
		

	});
});
  /*
  describe('singup', function() {
  
      beforeEach(function() {
        browser.navigate('/signup');
      });
  
      
  
    });*/
  


 /*
  describe('Welcome', function() {
 
     beforeEach(function() {
       browser.navigate('/welcome');
     });
 
 
     it('should redirect a non-logged in user to the login page', function() {
       expect(browser.getLocationAbsUrl).toBe("/must-login");
     });
 
   });*/
 
  
	/*
	describe('Admin', function() {
	
	    beforeEach(function() {
	      browser.navigate('/admin');
	    });
	
	
	    it('should redirect a non-admin to the login page', function() {
	      expect(browser.getLocationAbsUrl).toBe("/must-login");
	    });
	
	  });*/
	

