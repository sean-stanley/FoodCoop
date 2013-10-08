function main($scope){

    $scope.orderField = "title";
    
    $scope.category = {"veg": true};

    $scope.test = [
        {
            title: "Apples, Mixed",
            category: "fruit",
            price: "2.50",
            unit: "kg",
            producer: "James",
            img: "apples.jpg"
        },
        {
            title: "Carrots",
            category: "veg",
            price: "3.50",
            unit: "kg",
            producer: "Steve Bob",
            img: "carrots.jpg"
        },
        {
            title: "Pumpkin, Crown",
            category: "veg",
            price: "3.50",
            unit: "each",
            producer: "James",
            img: "pumpkin.jpg"
        },
        {
            title: "Lettuce, Romane",
            category: "veg",
            price: "3.00",
            unit: "each",
            producer: "George",
            img: "lettuce.jpg"
        },
        {
            title: "Beetroot",
            category: "veg",
            price: "5.50",
            unit: "kg",
            producer: "Peter",
            img: "beetroot.jpg"
        },
        {
            title: "Apples, Sundowner",
            category: "fruit",
            price: "5.50",
            unit: "kg",
            producer: "Peter",
            img: "sundowner%20apple.jpg"
        },
        {
            title: "Tomatoes, Romanic",
            price: "6.50",
            unit: "kg",
            producer: "James",
            img: "tomatoes.jpg"
        },
        {
            title: "Capsicum, Mixed",
            price: "2.00",
            unit: "bag",
            producer: "Peter",
            img: "capsicum.jpg"
        },
        {
            title: "Peaches",
            price: "2.00",
            unit: "bag",
            producer: "Peter",
            img: "peach.jpeg"
        },
        {
            title: "Nectarine",
            price: "2.50",
            unit: "bag",
            producer: "Fred",
            img: "nectarine.jpeg"
        },
        {
            title: "Plums",
            price: "2.50",
            unit: "bag",
            producer: "Fred",
            img: "plum.jpeg"
        },
        {
            title: "Apricots",
            price: "2.50",
            unit: "bag",
            producer: "Fred",
            img: "apricot.jpeg"
        },
        {
            title: "Plums",
            price: "2.50",
            unit: "bag",
            producer: "Fred",
            img: "plum2.jpeg"
        },
        {
            title: "Peaches",
            price: "2.10",
            unit: "bag",
            producer: "Fred",
            img: "peach2.jpg"
        },
        {
            title: "Apples, Rose",
            price: "2.00",
            unit: "bag",
            producer: "Peter",
            img: "apples2.jpeg"
        },
        {
            title: "Kale",
            price: "3.00",
            unit: "bunch",
            producer: "James",
            img: "kale.jpg"
        },
        {
            title: "Carrots",
            price: "3.00",
            unit: "bunch",
            producer: "James",
            img: "carrot3(1).jpg"
        },
        {
            title: "Lettuce, Fancy",
            price: "3.00",
            unit: "each",
            producer: "George",
            img: "lettuce2.jpeg"
        },
        {
            title: "Apricots",
            price: "3.00",
            unit: "bag",
            producer: "George",
            img: "apricot2.jpeg"
        },
        {
            title: "Apricots",
            price: "2.00",
            unit: "bag",
            producer: "Jeff",
            img: "apricot3.jpeg"
        },
        {
            title: "Squash",
            price: "4.00",
            unit: "kg",
            producer: "Plymouth Farms",
            img: "squash.jpg"
        },
        {
            title: "Lettuce, Cos",
            price: "3.00",
            unit: "each",
            producer: "Plymouth Farms",
            img: "cos%20lettuce.jpeg"
        },
        {
            title: "Apricots",
            price: "3.00",
            unit: "bag",
            producer: "Plymouth Farms",
            img: "apricot4.jpeg"
        },
        {
            title: "Macadamia Nuts",
            price: "5.50",
            unit: "100g",
            producer: "Jim Bob",
            img: "nuts.jpg"
        },
        {
            title: "Apricots, Dried",
            price: "0.50",
            unit: "100g",
            producer: "Jim Bob",
            img: "i-apricots-dried.jpg"
        },
        {
            title: "Apricots, Canned",
            price: "2.00",
            unit: "jar",
            producer: "Jim Bob",
            img: "canned-apricots.jpg"
        },
        {
            title: "Lettuce, Variety Pack",
            price: "3.00",
            unit: "each",
            producer: "George",
            img: "variety%20lettuce.jpeg"
        },
        {
            title: "Spinach",
            price: "2.00",
            unit: "bunch",
            producer: "George",
            img: "spinach.jpg"
        },
        {
            title: "Spinach",
            price: "2.00",
            unit: "bunch",
            producer: "Steve",
            img: "spinach2.jpg"
        },
        {
            title: "Spinach",
            price: "1.00",
            unit: "100g",
            producer: "Jim Bob",
            img: "spinach3.jpg"
        },
        {
            title: "Pumpkin",
            price: "3.00",
            unit: "each",
            producer: "Jim Bob",
            img: "pumpkin2.jpeg"
        },
        {
            title: "Pumpkin",
            price: "2.00",
            unit: "each",
            producer: "Steve",
            img: "pumpkin3.jpeg"
        },
        {
            title: "Pumpkin, Miscellanous",
            price: "3.00",
            unit: "each",
            producer: "Plymouth Farms",
            img: "pumpkin4.jpeg"
        },
        {
            title: "Spinach",
            price: "1.50",
            unit: "bag",
            producer: "Jeff",
            img: "spinach4.jpg"
        },
        {
            title: "Bok Choy",
            price: "1.50",
            unit: "bunch",
            producer: "Asian First",
            img: "bok-choy.jpeg"
        },
        {
            title: "Bitter Melon",
            price: "3.50",
            unit: "each",
            producer: "Asian First",
            img: "melon.jpg"
        }];
}

filter('categorise', function() {
    return function(input) {
        var out = "test";
        return out;
    }
});
