from django.db import models
from simsam_app.models import *

def cloneAnimation(animation, new_project):
    animation.id = None
    animation.project_id = new_project.id
    animation.name = new_project.name + "-anim0"
    animation.save()

    # We don't need to clone animation frames b/c they don't have info
    # specific to the project or user, etc.

def cloneSimObject(simObj, sim):
    simObj.id = None
    simObj.simulation_id = sim.id
    # It's ok if they share the files, they aren't editable
    simObj.save()

def cloneSimState(state, sim):
    state.id = None
    state.simulation_id = sim.id
    state.save()

def cloneSimulation(simulation, new_project):
    old_sim_id = simulation.id
    simulation.id = None  # Generate a new key
    simulation.project_id = new_project.id
    simulation.save()

    simobjects = SimulationObject.objects.filter(simulation_id=old_sim_id)
    for obj in simobjects:
        cloneSimObject(obj, simulation)

    simstates = SimulationState.objects.filter(simulation_id=old_sim_id)
    for state in simstates:
        print >> sys.stderr, "Cloning simstate %d" % old_sim_id
        cloneSimState(state, simulation)
    

def cloneProject(project, owner):
    """clone an instance of a project (django model).
    N.B. This is structure dependent, so if you change the structure you
    must update this function as well, it is not automagic.
    """
    old_project_id = project.id
    project.id = None;  # Generate a new key
    project.owner_id = owner  # May or may not be different
    # This is just fancy, you can rip it out
    project.name = project.name + '-clone'
    project.is_public = False  # Just because it's a clone of a public proj
    project.save()

    animations = Animation.objects.filter(project_id=old_project_id)
    for anim in animations:
        cloneAnimation(anim, project)

    simulations = Simulation.objects.filter(project_id=old_project_id)
    for sim in simulations:
        print >> sys.stderr, "Cloning Simulation, project %d" % old_project_id
        cloneSimulation(sim, project)

    return project
