from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect

import random

from samlite.models import Animation
from samlite.models import AnimationFrame

#debugging

import pprint

def index(request):
    t = loader.get_template("samlite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
    
def save_frame(request):
    image_string = request.POST[u"image_string"]
    image_directory = request.POST["image_directory"]
    frame = AnimationFrame();
    frame.set_image_string(image_string)
    frame.save(image_directory)
    return HttpResponse('{"success": true, "id": %s}' % (frame.id))
