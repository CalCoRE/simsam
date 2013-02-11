from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib.auth import authenticate, login, logout

import random

from samlite.models import Animation
from samlite.models import AnimationFrame
from home.models import Sprite

#debugging

import pprint

from django.contrib.auth.decorators import login_required

#@login_required
def index(request):
    t = loader.get_template("samlite.html")
    c = RequestContext(request, {})
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
