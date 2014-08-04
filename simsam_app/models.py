from __future__ import unicode_literals

import datetime
import os
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

import util

class Project(models.Model):
    """A project containing an animation, a simulation, and associated data."""
    name = models.CharField(max_length=100)
    owner = models.ForeignKey('SimsamUser', related_name="projects")
    parent_project = models.ForeignKey(
        'Project', related_name='child_projects', blank=True, null=True)

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

    @classmethod
    def lookup(klass, user):
        if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
            if user._wrapped.__class__ == object:
                    user._setup()
            user = user._wrapped
        results = SimsamUser.objects.filter(user=user)
        if len(results) == 0:
            # for whatever reason, the session user doesn't have a matching
            # database (simsam) user, so make one, save it, and move on.
            simsam_user = SimsamUser.objects.create(user=user, first_name=user.username)
        elif len(results) > 1:
            raise Exception('More than one user found')
        else:
            # we've eliminated the other possibilities, we can safely reference
            # the first index of this list
            simsam_user = results[0]
        return simsam_user


    def __unicode__(self):
        return self.first_name + u' ' + self.last_name


class ImageWrapper(models.Model):
    """Handles base64-string-encoded images and saving them; is abstract."""
    # db fields
    image_hash = models.CharField(max_length=40, primary_key=True)
    created_date = models.DateTimeField(
        'date created', default=datetime.datetime.now)

    # python's funky way of making this class abstract
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
            file_name = self.image_hash + ".jpg"
            image_path = os.path.join(self.image_directory, file_name)
            output = open(image_path, "wb")
            output.write(image_data)
            output.close()
            self.string_data = None

        # do the default django save magic
        super(ImageWrapper, self).save(*args, **kwargs)


class Animation(models.Model):
    """The SAM in SiMSAM."""
    name = models.CharField(max_length=40)
    project = models.ForeignKey(Project, related_name='animations')
    parent_animation = models.ForeignKey(
        'self', related_name='child_animations', blank=True, null=True)
    # comma-separated list of hashes
    #frame_sequence = models.TextField(blank=True, default='')
    frame_sequence = util.ListField()
    # comma-separated list of hashes
    #sprite_collection = models.TextField(blank=True, default='')
    sprite_collection = util.ListField()

    # implicit properties
    # * child_animations (many child animations to one parent animation)

    def __unicode__(self):
        return self.name


class AnimationFrame(ImageWrapper):
    """An single frame of an animation; really just a jpg image."""
    # db fields
    # nothing to do, everything done in ImageWrapper

    # constants
    image_directory = os.path.join(settings.MEDIA_ROOT, 'sam_frames')


class Sprite(ImageWrapper):
    """A little image, cropped from a sam, used in a sim."""
    name = models.CharField(max_length=100)

    image_directory = os.path.join(settings.MEDIA_ROOT, 'sprites')


class Simulation(models.Model):
    """The Si in SiMSAM."""
    name = models.CharField(max_length=40)
    project = models.ForeignKey(Project, related_name='simulations')
    parent_simulation = models.ForeignKey(
        'self', related_name='child_simulations', blank=True, null=True)

    # implicit properties
    # * objects (many-to-many)
    # * states (many states to one simulation)
    # * child_simulations (many child simulations to one parent simulation)

    def __unicode__(self):
        return self.name


class SimulationState(models.Model):
    """The saved state/condition/arrangement of a simulation at one moment."""
    name = models.CharField(max_length=40)
    simulation = models.ForeignKey(Simulation, related_name='states')
    serialized_state = models.TextField()
    is_current = models.BooleanField()

    def __unicode__(self):
        return self.name


class SimulationObject(models.Model):
    """An entity/object/thing in a simulation."""
    sprite_filename = models.CharField(max_length=40)
    serialized_rules = models.TextField(blank=True, default='')
    simluations = models.ManyToManyField(Simulation, related_name='objects')

    def __unicode__(self):
        return self.sprite_filename
