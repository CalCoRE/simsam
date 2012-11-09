from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect

#debugging

import pprint

def index(request):
    t = loader.get_template("samlite/index.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
    
def images(request, file):
    return HttpResponseRedirect("/static/images/" + file)
    
def css(request, file):
    return HttpResponseRedirect("/static/css/" + file)

def js(request, file):
    return HttpResponseRedirect("/static/js/" + file)