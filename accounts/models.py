from django.db import models
from django.contrib.auth.models import AbstractBaseUser

# the new user with all the details we need

class CoopMember(AbstractBaseUser):
	username = models.CharField(max_length=40, unique=True, db_index=True)
	firstname = models.CharField(max_length=40, db_index=True)
	lastname = models.CharField(max_length=40, db_index=True)
	email = models.EmailField(max_length=254, unique=True)
	
	USERNAME_FIELD = 'email'
	
