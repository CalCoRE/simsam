from django.db import models
import datetime
import random

# Create your models here.

class Animation(models.Model):
    """The SAM in SiMSAM."""
    name = models.CharField(max_length=40)
    project = models.ForeignKey('Project', related_name='animations')
    parent_animation = models.ForeignKey('Animation',
        related_name='child_animations')
    frame_sequence = models.TextField()     # comma-separated list of hashes
    sprite_collection = models.TextField()  # comma-separated list of hashes

    # implicit properties
    # * child_animations (many child animations to one parent animation)

class AnimationFrame(models.Model):
    """An single frame of an animation; really just a jpg image."""
    # db fields
    image_hash = models.CharField(max_length=40, primary_key=True)
    created_date = models.DateTimeField('date created',
        default=datetime.datetime.now)

    # constants
    #image_directory = "sitestatic/media/sam_frames/"

    # vars
    string_data = None

    # methods
    def set_image_string(self, string_data):
        """Store image data (as a base64 string) and its hash."""
        self.string_data = string_data
        self.image_hash = str(abs(string_data.__hash__()))

    # this overrides the default save method inherited from Model
    # so we can save the image file as the same time as the object
    def save(self, image_directory, *args, **kwargs):
        # part of saving should be writing the image file
        # if this is a first-time instantiation
        if self.string_data:
            image_data = self.string_data.decode("base64")
            output = open(image_directory + self.id + ".jpg", "wb")
	    #output = open(self.image_directory + self.id + ".jpg", "wb")
            output.write(image_data)
            output.close()
            self.string_data = None

        # do the default django save magic
        super(Sam_frame, self).save(*args, **kwargs)
