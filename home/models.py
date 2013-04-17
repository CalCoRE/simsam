from django.db import models
from django.contrib.auth.models import User

import datetime

# Create your models here.
class Project(models.Model):
    """A project containing an animation, a simulation, and associated data."""
    name = models.CharField(max_length=100)
    owner = models.ForeignKey('SimsamUser', related_name="projects")
    parent_project = models.ForeignKey('Project',
        related_name='child_projects', blank=True, null=True)

    # implicit properties
    # * animations (many animations to one project)
    # * simulations (many simulations to one project)
    # * child_projects (many child projects to one parent project)

    def __unicode__(self):
        return self.name

class SimsamUser(models.Model):  
    """One-to-one with a django user, but with SiMSAM-related info."""
    user = models.OneToOneField(User, primary_key=True)
    first_name = models.CharField(max_length=40)
    last_name = models.CharField(max_length=40)
    sprite_collection = models.TextField(blank=True, default='')

    # implicit properties
    # * projects (many projects to one owner)

    def __unicode__(self):
        return self.first_name + u' ' + self.last_name

class ImageWrapper(models.Model):
    """Handles base64-string-encoded images and saving them; is abstract."""
    # db fields
    image_hash = models.CharField(max_length=40, primary_key=True)
    created_date = models.DateTimeField('date created',
        default=datetime.datetime.now)

    class Meta:
        abstract = True

    # this constant should be set in inheriting classes
    # image_directory = "sitestatic/media/???/"

    # vars
    string_data = None

    # methods
    def __unicode__(self):
        return self.image_hash

    def set_image_string(self, string_data):
        """Store image data (as a base64 string) and its hash."""
        self.string_data = string_data
        self.image_hash = str(abs(string_data.__hash__()))

    # this overrides the default save method inherited from Model
    # so we can save the image file as the same time as the object
    def save(self, *args, **kwargs):
        # part of saving should be writing the image file
        # if this is a first-time instantiation
        if self.string_data:
            image_data = self.string_data.decode("base64")
            output = open(self.image_directory + self.image_hash + ".jpg", "wb")
            output.write(image_data)
            output.close()
            self.string_data = None

        # do the default django save magic
        super(ImageWrapper, self).save(*args, **kwargs)

class Sprite(ImageWrapper):
    """A little image, cropped from a sam, used in a sim."""
    name = models.CharField(max_length=100)

    #image_directory = "sitestatic/media/sprites/"
    image_directory = "/home/chrism/simsam/sitestatic/media/sprites/"
