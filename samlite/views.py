from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect

#debugging

import pprint

def index(request):
    t = loader.get_template("samlite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
    

