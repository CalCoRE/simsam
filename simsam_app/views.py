from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.utils import simplejson as json
from django.contrib.auth.decorators import login_required

from simsam_app.models import *

#debugging

import pprint


def home(request):
    """Welcome/home screen; doesn't require log in."""
    t = loader.get_template("createOrOpenProject.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))


@login_required
def app(request):
    """Where the SiMSAM action is at."""
    simsam_user = SimsamUser.lookup(request.user)
    project_id = request.REQUEST.get('project', None)
    animation_id = request.REQUEST.get('animation', None)
    project = Project.objects.get(id=int(project_id))
    animation = Animation.objects.get(id=int(animation_id))
    t = loader.get_template("sam.html")
    c = RequestContext(request, {
        "project_name": project.name,
        "project_id": project_id,
        "animation_name": animation.name,
        "animation_id": animation_id,
        "frame_sequence": animation.frame_sequence,
        "sprite_collection": animation.sprite_collection,
        "simsam_user": simsam_user
    })
    return HttpResponse(t.render(c))


def sandbox(request):
    """Debugging environment."""
    t = loader.get_template("sandbox.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))


def login_user(request):
    """Currently a separate page; todo: embed form in home, make this ajax."""
    state = "Welcome to SiMSAM! Please log in below..."
    username = password = ''
    redirect_to = request.REQUEST.get('next','')
    if request.POST:
        username = request.REQUEST.get('username')
        password = request.REQUEST.get('password')
        next_url = request.REQUEST.get('next','')

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                if len(SimsamUser.objects.filter(user=user)) < 1:
                        SimsamUser.objects.create(user=user, first_name=user.username)
                if len(next_url) > 0:
                        return HttpResponseRedirect(next_url)
                else:
                        #return HttpResponseRedirect(redirect_to)
                        t = loader.get_template("createOrOpenProject.html")
                        c = RequestContext(request, {})
                        return HttpResponseRedirect('/')
            else:
                state = "Your account is not active, please contact the site admin."
        else:
            state = "The username and password were incorrect."
    t = loader.get_template("login.html")
    c = RequestContext(request, {"next": redirect_to,})
    return HttpResponse(t.render(c))


def logout_user(request):
    logout(request)
    return HttpResponseRedirect("/")


@login_required
def save_image(request):
    """Saves base64-encoded strings as jpgs, either sam frames or sprites."""
    image_string = request.REQUEST.get('image_string')
    image_type = request.REQUEST.get('image_type')
    animation_id = request.REQUEST.get('animation_id')
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

    return HttpResponse(json.dumps({
        'success': success,
        'id': image_obj.image_hash,
        'message': message,
    }))


@login_required
def save_frame_sequence(request):
    """Save a new frame sequence on image reordering in the timeline."""
    animation_id = request.REQUEST.get('animation_id', default=None)
    frame_sequence = [int(x) for x in request.REQUEST.getlist('frame_sequence[]')]
    animation = Animation.objects.get(id=animation_id)
    animation.frame_sequence = frame_sequence
    animation.save()
    return HttpResponse(json.dumps({
        'success': True,
        'message': ""
    }))


@login_required
def make_project(request):
    """Create a new project with a given name and open it."""
    simsam_user = SimsamUser.lookup(request.user)
    project_name = request.REQUEST.get('projectName')
    if len(simsam_user.projects.filter(name=project_name)) > 0:
        # if the project name already exists, open it
        project = simsam_user.projects.get(name=project_name)
        anim1 = project_name + "-anim0"
        animation = project.animations.get(name=anim1)
        return HttpResponseRedirect("/app?project={}&animation={}".format(
            project.id, animation.id))
    else:
        # set up the new project
        project = Project.objects.create(name=project_name, owner=simsam_user)
        animation = project.animations.create(name=project_name + "-anim0")
        simulation = project.simulations.create(name=project_name + "-sim0")
        project.save()
        animation.save()
        simulation.save()
        return HttpResponseRedirect("/app?project={}&animation={}".format(
            project.id, animation.id))


@login_required
def newanim(request):
    """Create a new animation within an open project."""
    project_id = request.REQUEST.get('projectId')
    animation_name = request.REQUEST.get('animName')
    project = Project.objects.get(id=project_id)
    if len(project.animations.filter(name=animation_name)) > 0:
            # if the animation already exists, open it
            animation = project.animations.get(name=animation_name)
    else:
            animation = project.animations.create(name=animation_name)
            project.save()
            animation.save()
    return HttpResponseRedirect("/app?project={}&animation={}".format(
        project.id, animation.id))


@login_required
def openproject(request):
    """Display the page listing current projects."""
    simsam_user = SimsamUser.lookup(request.user)
    projects = Project.objects.filter(owner=simsam_user)
    t = loader.get_template("chooseproject.html")
    c = RequestContext(request, {"projectList": projects})
    return HttpResponse(t.render(c))


@login_required
def chooseproject(request):
    """Open the chosen project."""
    simsam_user = SimsamUser.lookup(request.user)
    project_id = request.REQUEST.get('projectId')
    #project = Project.objects.get(name=project_name, owner=simsam_user)
    project = Project.objects.get(id=project_id)
    anim1 = project.name + "-anim0"
    animation = project.animations.get(name=anim1)
    return HttpResponseRedirect("/app?project={}&animation={}".format(
        project.id, animation.id))


@login_required
def openAnim(request):
    """Display the page listing the project's animations."""
    project_id = request.REQUEST.get('projectId')
    project = Project.objects.get(id=project_id)
    animations = project.animations.all()
    t = loader.get_template("chooseanim.html")
    c = RequestContext(request, {"animList": animations, "project": project})
    return HttpResponse(t.render(c))


@login_required
def chooseanim(request):
    """Open the chosen animation."""
    project_id = request.REQUEST.get('projectId')
    animation_id = request.REQUEST.get('animId')
    return HttpResponseRedirect("/app?project={}&animation={}".format(
        project_id, animation_id))


# chris wrote this just for testing sprite.coffee, it should be removed
# eventually
def sprite(request):
    t = loader.get_template("sprite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
