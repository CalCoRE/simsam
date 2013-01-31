from django.db import models
import datetime
import random

# Create your models here.

class Sam_frame(models.Model):
    # db fields
    id = models.CharField(max_length=20, primary_key=True)
    created_date = models.DateTimeField('date created',
        default=datetime.datetime.now)

    # constants
    #image_directory = "sitestatic/media/sam_frames/"

    # vars
    string_data = None

    def set_image_string(self, string_data):
        self.string_data = string_data
        self.id = str(abs(string_data.__hash__()))

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


class Sam_project(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    creator_id = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
