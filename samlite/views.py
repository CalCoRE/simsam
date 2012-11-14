from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect

import random

from samlite.models import Sam_frame

#debugging

import pprint

def index(request):
    t = loader.get_template("samlite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
    
def save_frame(request):
    image_string = request.POST[u"image_string"]
    sam_frame = Sam_frame();
    sam_frame.set_image_string(image_string)
    sam_frame.save()
    return HttpResponse('{"success": true, "id": %s}' % (sam_frame.id))
