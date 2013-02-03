from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect

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
