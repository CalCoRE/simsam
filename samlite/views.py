from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib.auth import authenticate, login, logout
from django.utils import simplejson as json

import random

'''from samlite.models import Animation
from samlite.models import AnimationFrame
from home.models import Sprite
from home.models import SimsamUser, Project'''

from home.models import *
from samlite.models import *

import ast

#debugging

import pprint

from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login 

#@login_required
def index(request):
    # check if logged in and get projects list
    # use template to display projects
    simsamuser = None
    projects = []
    animation = None
    simulation = None
    project = None
    framesequence = []
    spritecollection = []
    image_hash = ""
    projectOpen = True
    #projectOpen = False
    if request.user.is_authenticated():
        user = request.user
        if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
                if user._wrapped.__class__ == object:
                        user._setup()
                user = user._wrapped
        simsamuser = SimsamUser.objects.filter(user=user)[0]
        projects = Project.objects.filter(owner=simsamuser)
    animations = Animation.objects.all()
    project = request.GET['project']
    animation = request.GET['animation']
    proj = Project.objects.get(id=int(project))
    proj_name = proj.name
    anim = Animation.objects.get(id=int(animation))
    anim_name = anim.name
    framesequence = anim.frame_sequence
    spritecollection = anim.sprite_collection

    t = loader.get_template("samlite.html")
    c = RequestContext(request, {"proj_name": proj_name, "project": project, "anim_name": anim_name, "animation": animation, "frame_sequence": framesequence, "sprite_collection": spritecollection, "simsamuser": simsamuser})
    #c = RequestContext(request, {"project": project, "animation": animation, "projectOpen": projectOpen, "image_hash": image_hash, "projectList": projects, "frame_sequence": framesequence, "sprite_collection": spritecollection, "simulation": simulation, "simsamuser": simsamuser})
    return HttpResponse(t.render(c))
    
def save_image(request):
    openingProject = False
    image_string = request.POST[u"image_string"]
    image_type = request.POST[u"image_type"]
    animation_id = request.POST.get(u'animation_id', default=None)
    if image_type == 'AnimationFrame':
        image_class = AnimationFrame
    elif image_type == 'Sprite':
        image_class = Sprite
    else:
        return HttpResponse(json.dumps({
            'success': False, 
            'message': "Invalid image type: %s." % image_type
        }))

    image_obj = image_class()
    image_obj.set_image_string(image_string)
    image_obj.save()

    # add the image hash to the animation frame sequence
    try:
        animation = Animation.objects.get(id=animation_id)
    except Animation.DoesNotExist:
        success = False
        message = "Invalid animation_id: %s." % animation_id
    else:
        success = True
        message = ''
        if image_type == 'AnimationFrame':
                animation.frame_sequence.append(image_obj.image_hash)
                animation.save()
	else:
		animation.sprite_collection.append(image_obj.image_hash)
	        animation.save()
        animation.save()

    return HttpResponse(json.dumps({
        'success': True,
        'id': image_obj.image_hash
    }))

#save a new frame sequence after images have been moved around in the timeline
def save_frame_sequence(request):
    if request.POST:
        animation_id = request.POST.get(u'animation_id', default=None)
        frame_sequence = [int(x) for x in request.POST.getlist(u'frame_sequence[]')]
        #frame_sequence = request.POST.get(u'frame_sequence[]')
        animation = Animation.objects.get(id=animation_id)
        #animation.frame_sequence = ListField()
        animation.frame_sequence = frame_sequence
        animation.save()

    return HttpResponse(json.dumps({
        'success': True,
        'message': ""
    }))

def logout_user(request):
    logout(request)
    return HttpResponseRedirect("/")

#start a new project
def make_project(request):
    openingProject = projectOpen = False
    projectName = ""
    simsamuser = project = animation = simulation = None
    framesequence = spritecollection = []
    if request.user.is_authenticated():
        user = request.user
        '''if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
                if user._wrapped.__class__ == object:
                        user._setup()
                user = user._wrapped'''
        simsamuser = SimsamUser.objects.filter(user=user)[0]
    
    projectName = request.POST.get('projectName')
    if len(simsamuser.projects.filter(name=projectName)) > 0:
            # if the project name already exists, open it
            return chooseproject(request)
    else:
            # set up the new project			
            project = Project.objects.create(name=projectName, owner=simsamuser)
            animation = project.animations.create(name=projectName + "-anim" + str(0))
            simulation = project.simulations.create(name=projectName + "-sim" + str(0)) 
            animation.save()
            simulation.save()
            project.save()   
            projectOpen = True
            return HttpResponseRedirect("/samlite?project=" + str(project.id) + "&animation=" + str(animation.id))   

# create a new animation within an open project
def newanim(request):
    projectOpen = True
    framesequence = spritecollection = []
    simsamuser = project = animation = None
    if request.POST:
        project_id = request.POST.get(u'projectId')
        simsamuser = request.POST.get(u'simsamuser')
        animName = request.POST.get('animName')
        project = Project.objects.get(id=project_id)
        if len(project.animations.filter(name=animName)) > 0:
                # if the animation already exists, open it
                animation = project.animations.get(name=animName)
                framesequence = animation.frame_sequence
                spritecollection = animation.sprite_collection
        else:
                animation = project.animations.create(name=animName)
                project.save()
                animation.save()
    return HttpResponseRedirect("/samlite?project=" + str(project.id) + "&animation=" + str(animation.id))   
    	
def openproject(request):
    # display the page listing current projects
    user = ""
    projects = []
    if request.user.is_authenticated():
        user = request.user
        '''if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
                if user._wrapped.__class__ == object:
                        user._setup()
                user = user._wrapped'''
        simsamuser = SimsamUser.objects.get(user=user)

    projects = Project.objects.filter(owner=simsamuser)
    t = loader.get_template("chooseproject.html")
    c = RequestContext(request, {"projectList": projects})
    return HttpResponse(t.render(c))

def chooseproject(request):
    # open the chosen project
    projectname = ""
    animations = []
    simsamuser = project = animation = simulation = None
    framesequence = spritecollection = []
    if request.user.is_authenticated():
        user = request.user
        '''if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
                if user._wrapped.__class__ == object:
                        user._setup()
                user = user._wrapped'''
        simsamuser = SimsamUser.objects.get(user=user)
    if request.POST:
        projectname = request.POST.get('projectName')
        #simsamuser = request.POST.get("simsamuser")
        project = Project.objects.get(name=projectname, owner=simsamuser)
        anim1 = project.name + "-anim" + str(0)
        animation = project.animations.get(name=anim1)
        framesequence = animation.frame_sequence
        spritecollection = animation.sprite_collection
        simulation = project.simulations.all()[0]
    # variables used to tell samlite.html what to display
    projectOpen = True 
    chooseProject = False
    openingProject = True

    return HttpResponseRedirect("/samlite?project=" + str(project.id) + "&animation=" + str(animation.id))


def openAnim(request):
    # display the page listing the project's animations
    user = ""
    animations = []
    project = None
    if request.POST:
        projectId = request.POST.get(u'projectId')
        project = Project.objects.get(id=projectId)
        animations = project.animations.all()
    t = loader.get_template("chooseanim.html")
    c = RequestContext(request, {"animList": animations, "project": project})
    return HttpResponse(t.render(c))

def chooseanim(request):
    # open the chosen animation
    animations = []
    simsamuser = None
    project = None
    framesequence = []
    spritecollection = []
    animation = None
    if request.POST:
        projectId = request.POST.get(u'projectId')
        animId = request.POST.get(u'animId')
        project = Project.objects.get(id=projectId)
        animation = Animation.objects.get(id=animId)
        framesequence = animation.frame_sequence
        spritecollection = animation.sprite_collection

    return HttpResponseRedirect("/samlite?project=" + str(project.id) + "&animation=" + str(animation.id))


	
