from django.db import models

from home.models import Project

# Create your models here.
class Simulation(models.Model):
    """The Si in SiMSAM."""
    name = models.CharField(max_length=40)
    project = models.ForeignKey(Project, related_name='simulations')
    parent_simulation = models.ForeignKey('self',
        related_name='child_simulations', blank=True)

    # implicit properties
    # * objects (many-to-many)
    # * states (many states to one simulation)
    # * child_simulations (many child simulations to one parent simulation)

class SimulationState(models.Model):
    """The saved state/condition/arrangement of a simulation at one moment."""
    name = models.CharField(max_length=40)
    simulation = models.ForeignKey(Simulation, related_name='states')
    serialized_state = models.TextField()
    is_current = models.BooleanField()

class SimulationObject(models.Model):
    """An entity/object/thing in a simulation."""
    sprite_filename = models.CharField(max_length=40)
    serialized_rules = models.TextField(blank=True)
    simluations = models.ManyToManyField(Simulation, related_name='objects',
        blank=True)