from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib.auth import authenticate, login, logout
from django.utils import simplejson

import random

from samlite.models import Animation
from samlite.models import AnimationFrame
from home.models import Sprite
from home.models import SimsamUser, Project

#debugging

import pprint

from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login

#globals
projects = []
simsamuser = None
animation = None
simulation = None
project = None
framesequence = []
spritecollection = []
image_hash = ""

#used to control display of elements in samlite.html
projectOpen = False
chooseProject = False 
openingProject = False 

#@login_required
def index(request):
    # check if logged in and get projects list
    # use template to display projects
    if request.user.is_authenticated():
	user = request.user
        if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
		if user._wrapped.__class__ == object:
			user._setup()
		user = user._wrapped
	global simsamuser
        simsamuser = SimsamUser.objects.filter(user=user)[0]
	global projects
        projects = Project.objects.filter(owner=simsamuser)
    animations = Animation.objects.all()
    t = loader.get_template("samlite.html")
    c = RequestContext(request, {"project": project, "animation": animation, "projectOpen": projectOpen, "image_hash": image_hash, "projectList": projects, "chooseProject": chooseProject, "frame_sequence": framesequence, "sprite_collection": spritecollection, "openingProject": openingProject, "simulation": simulation})
    return HttpResponse(t.render(c))
    
def save_image(request):
    global openingProject
    openingProject = False
    image_string = request.POST[u"image_string"]
    image_type = request.POST[u"image_type"]
    if image_type == 'AnimationFrame':
        image_class = AnimationFrame
    elif image_type == 'Sprite':
        image_class = Sprite
    else:
        return HttpResponse('''{
            "success": false, 
            "message": "invalid image type: %s"
        }''' % image_type)

    image_obj = image_class();
    image_obj.set_image_string(image_string)
    image_obj.save()
    # add the image hash to the animation frame sequence
    if image_type == 'AnimationFrame':
    	if len(animation.frame_sequence) == 0:
		global animation
		animation.frame_sequence = image_obj.image_hash
    	else:
		global animation
    		animation.frame_sequence = animation.frame_sequence + ", " + image_obj.image_hash
    else:
	if len(animation.sprite_collection) == 0:
		global animation
		animation.sprite_collection = image_obj.image_hash
	else:
		global animation
		animation.frame_sequence = animation.frame_sequence + ", " + image_obj.image_hash
    animation.save()
    global image_hash
    image_hash = image_obj.image_hash
    return HttpResponse('{"success": true, "id": %s}' % (image_obj.image_hash))

#process user login
def login_user(request):
    state = "Please log in below..."
    username = password = ''
    if request.POST:
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                state = "You're successfully logged in!"
                return HttpResponseRedirect('/samlite')
            else:
                state = "Your account is not active, please contact the site admin."
    return HttpResponseRedirect('/samlite')

    #return render_to_response('samlite.html', {'state':state, 'username': username})

def logout_user(request):
    logout(request)
    # reset globals
    global simsamuser
    simsamuser = None
    global project
    project = None
    global animation
    animation = None
    global simulation
    simulation = None
    global projects
    projects = []
    global projectOpen
    projectOpen = False
    global image_hash
    image_hash = ""
    global chooseProject
    chooseProject = False
    global framesequence
    framesequence = []
    global spritecollection
    spritecollection = []
    global openingProject
    openingProject = False

    return HttpResponseRedirect('/samlite')

#start a new project
def make_project(request):
	global openingProject
	openingProject = False
	projectName = ""
	if request.POST:
		projectName = request.POST.get('projectName')
                global simsamuser
                if len(simsamuser.projects.filter(name=projectName)) > 0:
			# if the project name already exists, open it
			chooseproject(request)
                else:
			# set up the new project			
			global project
			project = Project.objects.create(name=projectName, owner=simsamuser)
			global animation
			animation = project.animations.create(name=projectName + "-anim" + str(0))
			global simulation
			simulation = project.simulations.create(name=projectName + "-sim" + str(0))               
			global projectOpen
			projectOpen = True
        		global framesequence
  			framesequence = []
        		global spritecollection
			spritecollection = []
	return HttpResponseRedirect('/samlite')

def newanim(request):
	# add a new animation to the current project
	numAnims = len(project.animations.all())
        projectName = str(project.name)
        global animation
	animation = project.animations.create(name=projectName + "-anim" + str(numAnims))
	global framesequence
	framesequence = []
	global spritecollection
	spritecollection = []
	return HttpResponseRedirect('/samlite')
	
    	
def openproject(request):
        # display the page listing current projects
    	#t = loader.get_template("chooseproject.html")
    	#c = RequestContext(request, {"projectList": projects})
	#return HttpResponse(t.render(c))
	global chooseProject
	chooseProject = True
        return HttpResponseRedirect("/samlite")

def chooseproject(request):
        # open the chosen project
	animations = []
	if request.POST:
		projectname = request.POST.get("projectName")
                global project
		project = Project.objects.get(name=projectname, owner=simsamuser)
		animations = project.animations.all()
        	if len(animations) > 0:
			# if there is an associated animation, open it
			global animation
			animation = animations[0]
			fs = str(animation.frame_sequence)
                	sc = str(animation.sprite_collection)
			if len(fs) > 0:
				global framesequence
				framesequence = fs.split(', ')
			if len(sc) > 0:
				global spritecollection
				spritecollection = sc.split(', ')
		else:
			global animation
			animation = None
		# variables used to tell samlite.html what to display
                global projectOpen
		projectOpen = True
		global chooseProject 
		chooseProject = False
   		global openingProject
		openingProject = True
	return HttpResponseRedirect("/samlite")
		
		

	
