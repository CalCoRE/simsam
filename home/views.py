from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout

#from samlite.models import Sam_frame

from home.models import SimsamUser

#debugging

import pprint

def index(request):
    """SiMSAM website home page"""
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


