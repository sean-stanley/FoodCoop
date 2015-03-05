// 'use strict';
//
// /* jasmine specs for controllers go here */
//
// describe('controllers', function(){
//   beforeEach(module('co-op.controllers'));
//
//
//   it('should ....', inject(function() {
//     //spec body
//   }));
//
//   it('should ....', inject(function() {
//     //spec body
//   }));
// });

'use strict';

(function() {
  // Articles Controller Spec
  describe('Co-op controllers', function() {
    describe('ProductUploadCtrl', function() {
      // The $resource service augments the response object with methods for updating and deleting the resource.
      // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
      // the responses exactly. To solve the problem, we use a newly-defined toEqualData Jasmine matcher.
      // When the toEqualData matcher compares two objects, it takes only object properties into
      // account and ignores methods.
      beforeEach(function() {
        jasmine.addMatchers({
          toEqualData: function() {
            return {
              compare: function(actual, expected) {
                return {
                  pass: angular.equals(actual, expected)
                };
              }
            };
          }
        });
      });

      beforeEach(function() {
        module('co-op');
        module('co-op.controllers');
				module('co-op.services');
      });

      // Initialize the controller and a mock scope
      var ProductUploadCtrl,
        scope,
        $httpBackend,
        $stateParams,
        $location;
			
			function emptyCondiments() {
				return [];
			}

      // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
      // This allows us to inject a service but then attach it to a variable
      // with the same name as the service.
      beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {

        scope = $rootScope.$new();
				
        $stateParams = _$stateParams_;

        $httpBackend = _$httpBackend_;

        $location = _$location_;
				

        MealsController = $controller('MealsController', {
          $scope: scope
        });

				
				$httpBackend.whenGET(/\.html$/).respond('');
				
				$httpBackend.whenGET('condiments').respond(emptyCondiments());

      }));

      it('$scope.find() should create an array with at least one meal object ' +
        'fetched from XHR', function() {

          // test expected GET request
					$httpBackend.expectGET('meals').respond([{
						title: 'Gourmet Salad',
            description: 'Gourment Salad Greens with Gourmet Tomatoes!',
						img: 'files/public/meals/test.jpg',
						price: 10,
						ingredients: [
							{name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'},
							{name: 'tomato', source: 'Whangarei', img: 'files/public/ingredients/test2.jpg'}
						],
						condiments: [
							{name: 'Balsamic Dressing', source: 'Kerikeri', img: 'files/public/condiment.test.jpg'},
							{name: 'Caesar Dressing', source: 'Kerikeri', img: 'files/public/condiment.test2.jpg'},
						]
          }]);

          // run controller
          scope.find();
          $httpBackend.flush();

          // test scope value
          expect(scope.meals[0].title).toEqual('Gourmet Salad');
					expect(scope.meals[0].price).toEqual(10);

        });

      it('$scope.findOne() should create an array with one meal object fetched ' +
        'from XHR using a mealId URL parameter', function() {
          // fixture URL parament
          $stateParams.mealId = '525a8422f6d0f87f0e407a33';

          // fixture response object
          var testMealData = function() {
            return {
	            _id: '525a8422f6d0f87f0e407a33',
							title: 'Gourmet Salad',
	            description: 'Gourment Salad Greens with Gourmet Tomatoes!',
							img: 'files/public/meals/test.jpg',
							price: 10,
							ingredients: [
								{name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'},
								{name: 'tomato', source: 'Whangarei', img: 'files/public/ingredients/test2.jpg'}
							],
							condiments: [
								{name: 'Balsamic Dressing', source: 'Kerikeri', img: 'files/public/condiment.test.jpg'},
								{name: 'Caesar Dressing', source: 'Kerikeri', img: 'files/public/condiment.test2.jpg'},
							]
            };
          };

          // test expected GET request with response object
					$httpBackend.expectGET(/meals\/([0-9a-fA-F]{24})$/).respond(testMealData());

          // run controller
          scope.findOne();
          $httpBackend.flush();

          // test scope value
          expect(scope.meal._id).toEqual(testMealData()._id);
					expect(scope.meal.title).toEqual(testMealData().title);
					expect(scope.meal.condiments).toEqual(testMealData().condiments);

        });

      it('$scope.create() with valid form data should send a POST request ' +
        'with the form input values and then ' +
        'locate to new object URL', function() {

          // fixture expected POST data
          var postMealData = function() {
            return {
							title: 'Gourmet Salad',
	            description: 'Gourment Salad Greens with Gourmet Tomatoes!',
							img: 'files/public/meals/test.jpg',
							price: 10,
							ingredients: [
								{name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'},
								{name: 'tomato', source: 'Whangarei', img: 'files/public/ingredients/test2.jpg'}
							],
							condiments: ['525a8422f6d0f87f0e407a33', '545a84t2f6d0f87f0e404a3w']
            };
          };

          // fixture expected response data
          var responseMealData = function() {
            return {
							__v : 0,
							title: 'Gourmet Salad',
	            description: 'Gourment Salad Greens with Gourmet Tomatoes!',
							img: 'files/public/meals/test.jpg',
							price: 10,
							ingredients: [
								{name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'},
								{name: 'tomato', source: 'Whangarei', img: 'files/public/ingredients/test2.jpg'}
							],
							condiments: ['525a8422f6d0f87f0e407a33', '545a84t2f6d0f87f0e404a3w'],
              _id: '525cf20451979dea2c000001',
	            created: '12-12-2014 14:04:34:96 NZT',
            };
          };

          // fixture mock form input values
          scope.title = 'Gourmet Salad';
          scope.description = 'Gourment Salad Greens with Gourmet Tomatoes!';
					scope.img = 'files/public/meals/test.jpg';
					scope.price = 10;
					scope.ingredients =  [
								{name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'},
								{name: 'tomato', source: 'Whangarei', img: 'files/public/ingredients/test2.jpg'}
							];
					scope.condimentsSelected = ['525a8422f6d0f87f0e407a33', '545a84t2f6d0f87f0e404a3w'];

          // test post request is sent
          $httpBackend.expectPOST('meals', postMealData()).respond(responseMealData());

          // Run controller
          scope.create(true);
          $httpBackend.flush();

          // test form input(s) are reset
          expect(scope.title).toEqual('');
          expect(scope.description).toEqual('');
					expect(scope.img).toEqual('');
					expect(scope.price).toEqual(0);
					expect(scope.ingredients).toEqual([]);
					expect(scope.condimentsSelected).toEqual([]);

          // test URL location to new object
          expect($location.path()).toBe('/meals/' + responseMealData()._id);
        });
				
			it('$scope.addIngredient(ingredient) should add ingredient to ' + 
				'$scope.ingredients and reset the ingredient field', function() {
					
					// define sample ingredient
					scope.ingredient = {name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'};
					
					// initialize empty ingredients array -- may be not necessary?
					scope.ingredients = [];
					
					expect(scope.ingredients.length).toEqual(0);
					
					scope.addIngredient(scope.ingredient);
					
					// test if ingredient was added to array
					expect(scope.ingredients).toContain({name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'});
					
					// test if scope.ingredient was reset by clearIngredient()
					expect(scope.ingredient.name).toBeUndefined();
					
					$httpBackend.flush();
				});
				
			it('$scope.addIngredient(ingredient) should add ingredient to ' + 
				'$scope.meal when editing a meal', function() {
					
					$stateParams.mealId = '525a8422f6d0f87f0e407a33';
					
          // fixture response object
          scope.meal = {
	            _id: '525a8422f6d0f87f0e407a33',
							title: 'Gourmet Salad',
	            description: 'Gourment Salad Greens with Gourmet Tomatoes!',
							img: 'files/public/meals/test.jpg',
							price: 10,
							ingredients: [
								{name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'},
								{name: 'tomato', source: 'Whangarei', img: 'files/public/ingredients/test2.jpg'}
							],
							condiments: [
								{name: 'Balsamic Dressing', source: 'Kerikeri', img: 'files/public/condiment.test.jpg'},
								{name: 'Caesar Dressing', source: 'Kerikeri', img: 'files/public/condiment.test2.jpg'},
							]
						};
					
					// define sample ingredient
					scope.ingredient = {name: 'cucumber', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'};
					
					// initialize empty ingredients array -- may be not necessary?
					scope.ingredients = [];
					
					expect(scope.meal.ingredients.length).toEqual(2);
					
					scope.addIngredient(scope.ingredient);
					
					// test if ingredient was added to array
					expect(scope.meal.ingredients).toContain({name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'});
					
					// test if scope.ingredient was reset by clearIngredient()
					expect(scope.ingredient.name).toBeUndefined();
					
					$httpBackend.flush();
				});

      it('$scope.update(true) should update a valid meal', inject(function(Meals) {

        // fixture rideshare
        var putMealsData = function() {
          return {
            _id: '525a8422f6d0f87f0e407a33',
            created: '12-12-2014 14:04:34:96 NZT',
						title: 'Gourmet Salad',
            description: 'Gourment Salad Greens with Gourmet Tomatoes!',
						img: 'files/public/meals/test.jpg',
						price: 10,
						ingredients: [
							{name: 'lettuce', source: 'Whangarei', img: 'files/public/ingredients/test.jpg'},
							{name: 'tomato', source: 'Whangarei', img: 'files/public/ingredients/test2.jpg'}
						],
						condiments: ['525a8422f6d0f87f0e407a33', '545a84d2f6d0f87f0e404a3c']
          };
        };

        // mock article object from form
        var meal = new Meals(putMealsData());

        // mock article in scope
        scope.meal = meal;

        // test PUT happens correctly
        $httpBackend.expectPUT(/meals\/([0-9a-fA-F]{24})$/).respond();

        // testing the body data is out for now until an idea for testing the dynamic updated array value is figured out
        //$httpBackend.expectPUT(/articles\/([0-9a-fA-F]{24})$/, putArticleData()).respond();
        /*
                Error: Expected PUT /articles\/([0-9a-fA-F]{24})$/ with different data
                EXPECTED: {"_id":"525a8422f6d0f87f0e407a33","title":"An Article about MEAN","to":"MEAN is great!"}
                GOT:      {"_id":"525a8422f6d0f87f0e407a33","title":"An Article about MEAN","to":"MEAN is great!","updated":[1383534772975]}
                */

        // run controller
        scope.update(true);
        $httpBackend.flush();

        // test URL location to new object
        expect($location.path()).toBe('/meals/' + putMealsData()._id);

      }));

      it('$scope.remove() should send a DELETE request with a valid mealId ' +
        'and remove the meal from the scope', inject(function(Meals) {

          // fixture rideshare
          var meal = new Meals({
            _id: '525a8422f6d0f87f0e407a33'
          });

          // mock rideshares in scope
          scope.meals = [];
          scope.meals.push(meal);

          // test expected rideshare DELETE request
          $httpBackend.expectDELETE(/meals\/([0-9a-fA-F]{24})$/).respond(204);
					$httpBackend.expectGET('/loggedin').respond({name: 'Sean Stanley'});

          // run controller
          scope.remove(meal);
          $httpBackend.flush();

          // test after successful delete URL location articles list
          expect($location.path()).toBe('/meals');
          expect(scope.meals).not.toContain(meal);
        }));
			
			afterEach(function() {
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			});
			
    });
  });
}());

