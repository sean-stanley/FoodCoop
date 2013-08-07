from django.db import models

# Create your models here.


class Product(models.Model):
	CATEGORY = (
		('fruit', 'Fruit'),
		('vegetable', 'Vegetable'),
		('beef', 'Beef'),
		('poultry', 'Poultry'),
		('milk', 'Milk'),
		('dairy_goods', 'Dairy Goods'),
		('honey', 'Honey'),
		('processed_goods', 'Processed Goods'),
	)
	
	
	producer = models.ForeignKey('accounts.Producer')
	details = models.CharField(max_length=900, db_index=True)
	price = models.DecimalField(max_digits=6, decimal_places=2)
	category = models.CharField(max_length=2, choices=CATEGORY)
	
	is_cert_organic = models.BooleanField(default=False)
    is_spray_free = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    is_free_range = models.BooleanField(default=False)


class OrderItem(models.Model):
	product = models.ForeignKey('Product')
	user = models.ForeignKey('accounts.user')
	quantity = models.PositiveIntegerField()
	
	markup = 1.2
	final_price = markup * product.price
