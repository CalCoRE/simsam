from __future__ import unicode_literals
from django.db import models
import random

from home.models import Project
from home.models import ImageWrapper

import ast


# Create your models here.

class ListField(models.TextField):
        __metaclass__ = models.SubfieldBase
        description = "Stores a python list"
        
        def __init__(self, *args, **kwargs):
                super(ListField, self).__init__(*args, **kwargs)

        def to_python(self, value):
                if not value:
                        value = []
                if isinstance(value, list):
                        return value
                return ast.literal_eval(value)
        
        def get_prep_value(self, value):
                if value is None:
                        return value
                return unicode(value)

        def value_to_string(self, obj):
                value = self._get_val_from_obj(obj)
                return self.get_db_prep_value(value)

class Animation(models.Model):
    """The SAM in SiMSAM."""
    name = models.CharField(max_length=40)
    project = models.ForeignKey(Project, related_name='animations')
    parent_animation = models.ForeignKey('self',
        related_name='child_animations', blank=True, null=True)
    # comma-separated list of hashes
    #frame_sequence = models.TextField(blank=True, default='')
    frame_sequence = ListField()
    # comma-separated list of hashes
    #sprite_collection = models.TextField(blank=True, default='')
    sprite_collection = ListField()

    # implicit properties
    # * child_animations (many child animations to one parent animation)

    def __unicode__(self):
        return self.name

class AnimationFrame(ImageWrapper):
    """An single frame of an animation; really just a jpg image."""
    # db fields
    # nothing to do, everything done in ImageWrapper

    # constants
    image_directory = "sitestatic/media/sam_frames/"
