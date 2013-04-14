from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser
import datetime

# the new user with all the details we need

class CoopManager(BaseUserManager):
    def create_user(self, email, twitter_handle, password=None):
        if not email:
            raise ValueError('Users must have an email address')
 
        user = self.model(
            email=MyUserManager.normalize_email(email),
            twitter_handle=twitter_handle,
        )
 
        user.set_password(password)
        user.save(using=self._db)
        return user
 
    def create_superuser(self, email, twitter_handle, password):
        user = self.create_user(email,
            password=password,
            twitter_handle=twitter_handle
        )
        user.is_admin = True
        user.save(using=self._db)
        return user


class CoopMember(AbstractBaseUser):
	NEAREST_PICKUP = (
         ('Whangarei', (
            	('vinyl', 'Hikurangi'),
            	('cd', 'Whangarei Central'),
            	('cd', 'Whangarei Central'),
            )
         ),
         ('Whangarei Heads', (
	            ('vhs', 'VHS Tape'),
	            ('dvd', 'DVD'),
	        )
	    ),
	    ('Tutukaka Coast', (
	            ('vhs', 'VHS Tape'),
	            ('dvd', 'DVD'),
	        )
	    ),
	    ('Bay of Islands', (
	            ('vhs', 'VHS Tape'),
	            ('dvd', 'DVD'),
	        )
	    ),
	    ('unknown', 'Kaikohe'),
	    ('unknown', 'Kaitaia'),
	    ('unknown', 'Dargaville'),
	    ('unknown', 'Waipu'),
	    ('unknown', 'Maungawhai'),
	    ('unknown', 'Maungaturoto'),
	    ('unknown', 'Kaiwaka'),
	)
    nearest_pickup = models.CharField(max_length=2, choices=NEAREST_PICKUP)
	
	whangarei_pickup = models.BooleanField(default=True)
	
	username = models.CharField(max_length=40, unique=True, db_index=True)
	firstname = models.CharField(max_length=40, db_index=True)
	lastname = models.CharField(max_length=40, db_index=True)
	email = models.EmailField(max_length=254, unique=True)
	member_since = datetime.date()
	
	is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
	
	objects = UserManager
	
	USERNAME_FIELD = 'email'
	REQUIRED_FIELDS = ['twitter_handle']

	
	
	def get_full_name(self):
        # For this case we return email. Could also be User.first_name User.last_name if you have these fields
        return self.email
 
    def get_short_name(self):
        # For this case we return email. Could also be User.first_name if you have this field
        return self.email
 
    def __unicode__(self):
        return self.email
 
    def has_perm(self, perm, obj=None):
        # Handle whether the user has a specific permission?"
        return True
 
    def has_module_perms(self, app_label):
        # Handle whether the user has permissions to view the app `app_label`?"
        return True
 
    @property
    def is_staff(self):
        # Handle whether the user is a member of staff?"
        return self.is_admin
	

class Post(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL)
