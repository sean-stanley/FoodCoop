from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser
import datetime

# the new user with all the details we need

class CoopManager(BaseUserManager):
    def create_user(self, email, password=None):
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
            	('hikurangi', 'Hikurangi'),
            	('cd', 'Whangarei Central'),
            	('cd', 'Whangarei Central'),
            )
         ),
         ('Whangarei Heads', (
	            ('parua-bay', 'Parua Bay'),
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
	    ('kaikohe', 'Kaikohe'),
	    ('kaitaia', 'Kaitaia'),
	    ('dargaville', 'Dargaville'),
	    ('waipu', 'Waipu'),
	    ('maungawhai', 'Maungawhai'),
	    ('maungaturoto', 'Maungaturoto'),
	    ('kaiwaka', 'Kaiwaka'),
	)
    nearest_pickup = models.CharField(max_length=2, choices=NEAREST_PICKUP)
	
	whangarei_pickup = models.BooleanField(default=True)
	
	username = models.CharField(max_length=40, unique=True, db_index=True)
	first_name = models.CharField(max_length=40, db_index=True)
	last_name = models.CharField(max_length=40, db_index=True)
	email = models.EmailField(max_length=254, unique=True)
	address = models.TextField(max_length=300, db_index=True)
	bankNumber = models.IntegerField(max_length= 14, unique=True)
	member_since = datetime.today()
	
	is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    
    producer = models.ForeignKey('Producer', null=True)
	
	objects = UserManager
	
	USERNAME_FIELD = 'email'
	REQUIRED_FIELDS = ['first_name','last_name', 'email', 'nearest_pickup','address',]

	
	
	def get_full_name(self):
        # For this case we return email. Could also be User.first_name User.last_name if you have these fields
        full_name = self.first_name.append(self.last_name)
        return self.full_name
 
    def get_short_name(self):
        # For this case we return email. Could also be User.first_name if you have this field
        return self.first_name
 
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
    
class Producer(models.Model)
	PRODUCER_Type = (
		('produce', 'Produce'),
		('meat', 'Meat'),
		('dairy', 'Dairy'),
		('processed', 'Processed Goods')
	)

	
	biography = models.Textfield(max_length=3000, db_index=True)
	photo = models.ImageField(upload_to='producer_photo/%Y/%m/%githud')
	is_approved = models.BooleanField(default=False)
	
