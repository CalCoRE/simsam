from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout

#from samlite.models import Sam_frame

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


