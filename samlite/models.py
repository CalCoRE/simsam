from django.db import models
import random

from home.models import Project
from home.models import ImageWrapper

# Create your models here.

class Animation(models.Model):
    """The SAM in SiMSAM."""
    name = models.CharField(max_length=40)
    project = models.ForeignKey(Project, related_name='animations')
    parent_animation = models.ForeignKey('self',
        related_name='child_animations', blank=True, null=True)
    # comma-separated list of hashes
    frame_sequence = models.TextField(blank=True, default='')
    # comma-separated list of hashes
    sprite_collection = models.TextField(blank=True, default='')

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
