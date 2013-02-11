from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib.auth import authenticate, login, logout

import random

from samlite.models import Sam_frame

#debugging

import pprint

from django.contrib.auth.decorators import login_required

#@login_required
def index(request):
    t = loader.get_template("samlite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
    
def save_frame(request):
    image_string = request.POST[u"image_string"]
    image_directory = request.POST["image_directory"]
    sam_frame = Sam_frame();
    sam_frame.set_image_string(image_string)
    sam_frame.save(image_directory)
    return HttpResponse('{"success": true, "id": %s}' % (sam_frame.id))

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
