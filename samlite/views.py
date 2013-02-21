from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib.auth import authenticate, login, logout

import random

from samlite.models import Animation
from samlite.models import AnimationFrame
from home.models import Sprite
from home.models import SimsamUser, Project

#debugging

import pprint

from django.contrib.auth.decorators import login_required

from django.contrib.auth import authenticate, login

#global user = None

#@login_required
def index(request):
    # check if logged in and get projects list
    # use template to display projects
    projects = []
    if request.user.is_authenticated():
	user = request.user
        if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
		if user._wrapped.__class__ == object:
			user._setup()
		user = user._wrapped
        simsamuser = SimsamUser.objects.filter(user=user)
        projects = Project.objects.filter(owner=simsamuser)
    animations = Animation.objects.all()
    t = loader.get_template("samlite.html")
    c = RequestContext(request, {"projectList": projects, "animations": animations})
    return HttpResponse(t.render(c))
    
def save_image(request):
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
    return HttpResponseRedirect('/samlite')

def save_project(request):
	# save the user's project
	# may need to adjust some of this later
	# this is just a save-as, not a saving over a project that already exists
	user = request.user 
	if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
		if user._wrapped.__class__ == object:
			user._setup()
		user = user._wrapped
        simsamuser = SimsamUser.objects.filter(user=user)[0] #would there ever be more than one simsamuser associated with the same user? I don't think so
	project_name = ""
        if request.POST:
		project_name = request.POST.get("project_name")
		Project.objects.create(name=project_name, owner=simsamuser)

		#if len(Project.objects.filter(name=project_name, owner=simsamuser)) == 0: #if project already exists, don't need to create a new one
			#project = Project.objects.create(name=project_name, owner=simsamuser)
		#else:
			#project = Project.objects.filter(name=project_name, owner=simsamuser)[0]
		#num_anims = len(Animation.objects.filter(project=project)

		#animation = Animation.objects.create(project=project, name=project_name + str(num_anims))
		#animation.frame_sequence.add(frame_registry)
	return HttpResponseRedirect('/samlite')

def save_anim(request, frameRegistry):
	anim_name = ""
	project_name = ""
	user = request.user 
	if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
		if user._wrapped.__class__ == object:
			user._setup()
		user = user._wrapped
        simsamuser = SimsamUser.objects.filter(user=user)[0]
	if request.POST:
		anim_name = request.POST.get("anim_name")
		project_name = request.POST.get("project_name")
		project = Project.objects.filter(owner=simsamuser, name=project_name)
		anim = Animation.objects.create(project=project, name=anim_name)
		anim.frame_sequence.add(frame_registry)
	return HttpResponseRedirect('/samlite')
		
	
def addframes(request):
	#frame_registry = request.POST.get('frame_registry')
	#t = loader.get_template("samlite.html")
    	#c = RequestContext(request, {"frame_registry": frame_registry})
	user = request.user 
	if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
		if user._wrapped.__class__ == object:
			user._setup()
		user = user._wrapped
	simsamuser = SimsamUser.objects.filter(user=user)[0]
        Projects.objects.create(owner=simsamuser, name="adding")
	#t.render(c)
    	return HttpResponseRedirect("/samlite")
    	


		
		

	
