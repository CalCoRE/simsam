from django.db import models

# Create your models here.

class Sam_frame(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    created_date = models.DateTimeField('date created')

class Sam_project(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    creator_id = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
