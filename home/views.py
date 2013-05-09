from django.template import RequestContext, loader, Context
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout

from django.shortcuts import render_to_response
from django.utils import simplejson as json

import random

from home.models import *

import ast

from django.contrib.auth.decorators import login_required

#debugging

import pprint

def index(request):
    if request.user.is_authenticated():
        #if the user is signed in, display the samlite.html page
        user = request.user
        if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
                if user._wrapped.__class__ == object:
                        user._setup()
                user = user._wrapped
        simsamuser = SimsamUser.objects.filter(user=user)[0]
        #projects = Project.objects.filter(owner=simsamuser)
        #animations = Animation.objects.all()
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
        return HttpResponse(t.render(c))        
    else:
        #if not logged in, display the login page
        t = loader.get_template("index.html")
        c = RequestContext(request, {})
        return HttpResponse(t.render(c))
    
def sandbox(request):
    """Debugging environment."""
    t = loader.get_template("sandbox.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))

#process user login
def login_user(request):
    state = "Please log in below..."
    username = password = ''
    simsamuser = None
    if request.POST:
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                state = "You're successfully logged in!"
                if len(SimsamUser.objects.filter(user=user)) < 1:
                        SimsamUser.objects.create(user=user, first_name=user.username)
               
                t = loader.get_template("createOrOpenProject.html")
                c = RequestContext(request, {})
                return HttpResponse(t.render(c))
            else:
                state = "Your account is not active, please contact the site admin."
   
    t = loader.get_template("createOrOpenProject.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))


def logout_user(request):
    logout(request)
    return HttpResponseRedirect("/")


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


#start a new project
def make_project(request):
    openingProject = projectOpen = False
    projectName = ""
    simsamuser = project = animation = simulation = None
    framesequence = spritecollection = []
    if request.user.is_authenticated():
        user = request.user
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
            return HttpResponseRedirect("/?project=" + str(project.id) + "&animation=" + str(animation.id)) 

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
    return HttpResponseRedirect("/?project=" + str(project.id) + "&animation=" + str(animation.id))  


    	
def openproject(request):
    # display the page listing current projects
    user = ""
    projects = []
    if request.user.is_authenticated():
        user = request.user
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

    return HttpResponseRedirect("/?project=" + str(project.id) + "&animation=" + str(animation.id))


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

    return HttpResponseRedirect("/?project=" + str(project.id) + "&animation=" + str(animation.id))

def sprite(request):
    t = loader.get_template("sprite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))



 


