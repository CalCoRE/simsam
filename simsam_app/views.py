from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.utils import simplejson as json
from django.contrib.auth.decorators import login_required

from simsam_app.models import *

#debugging

import pprint


@login_required
def app(request):
    if request.user.is_authenticated():
        #if the user is signed in, display the samlite.html page
        simsam_user = SimsamUser.lookup(request.user)
        project_id = request.get('project', None)
        animation_id = request.get('animation', None)
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
    # state = "Please log in below..."
    username = password = ''
    if request.POST:
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                # state = "You're successfully logged in!"
                if len(SimsamUser.objects.filter(user=user)) < 1:
                        SimsamUser.objects.create(user=user, first_name=user.username)
                t = loader.get_template("createOrOpenProject.html")
                c = RequestContext(request, {})
                return HttpResponse(t.render(c))
            else:
                pass
                # state = "Your account is not active, please contact the site admin."
        else:
            pass
            # state = "The username and password were incorrect."

    t = loader.get_template("createOrOpenProject.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))


def logout_user(request):
    logout(request)
    return HttpResponseRedirect("/")


@login_required
def save_image(request):
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

    return HttpResponse(json.dumps({
        'success': success,
        'id': image_obj.image_hash,
        'message': message,
    }))


#save a new frame sequence after images have been moved around in the timeline
@login_required
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
@login_required
def make_project(request):
    project_name = ""
    simsamuser = project = animation = simulation = None
    if request.user.is_authenticated():
        user = request.user
        simsamuser = SimsamUser.objects.filter(user=user)[0]

    project_name = request.POST.get('projectName')
    if len(simsamuser.projects.filter(name=project_name)) > 0:
        # if the project name already exists, open it
        return chooseproject(request)
    else:
        # set up the new project
        project = Project.objects.create(
            name=project_name, owner=simsamuser)
        animation = project.animations.create(
            name=project_name + "-anim" + str(0))
        simulation = project.simulations.create(
            name=project_name + "-sim" + str(0))
        animation.save()
        simulation.save()
        project.save()
        return HttpResponseRedirect("/?project={}&animation={}".format(
            project.id, animation_id))


# create a new animation within an open project
@login_required
def newanim(request):
    project = animation = None
    if request.POST:
        project_id = request.get('projectId')
        # unused, but available
        # simsamuser = request.get('simsamuser')
        animName = request.POST.get('animName')
        project = Project.objects.get(id=project_id)
        if len(project.animations.filter(name=animName)) > 0:
                # if the animation already exists, open it
                animation = project.animations.get(name=animName)
        else:
                animation = project.animations.create(name=animName)
                project.save()
                animation.save()
    return HttpResponseRedirect("/?project={}&animation={}".format(
        project_id, animation_id))


@login_required
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


@login_required
def chooseproject(request):
    # open the chosen project
    project_name = ""
    simsam_user = project = animation = None
    if request.user.is_authenticated():
        simsam_user = SimsamUser.lookup(request.user)
    if request.POST:
        project_name = request.get('projectName')
        #simsam_user = request.POST.get("simsam_user")
        project = Project.objects.get(name=project_name, owner=simsam_user)
        anim1 = project.name + "-anim" + str(0)
        animation = project.animations.get(name=anim1)

    return HttpResponseRedirect("/?project={}&animation={}".format(
        project.id, animation.id))


@login_required
def openAnim(request):
    # display the page listing the project's animations
    animations = []
    project = None
    if request.POST:
        projectId = request.POST.get(u'projectId')
        project = Project.objects.get(id=projectId)
        animations = project.animations.all()
    t = loader.get_template("chooseanim.html")
    c = RequestContext(request, {"animList": animations, "project": project})
    return HttpResponse(t.render(c))


@login_required
def chooseanim(request):
    # open the chosen animation
    project = None
    animation = None
    if request.POST:
        project_id = request.POST.get(u'projectId')
        animId = request.POST.get(u'animId')
        project = Project.objects.get(id=project_id)
        animation = Animation.objects.get(id=animId)

    return HttpResponseRedirect("/?project={}&animation={}".format(
        project.id, animation.id))


# chris wrote this just for testing sprite.coffee, it should be removed
# eventually
def sprite(request):
    t = loader.get_template("sprite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
