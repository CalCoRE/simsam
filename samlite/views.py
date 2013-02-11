from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import HttpResponseRedirect

import random

from samlite.models import Animation
from samlite.models import AnimationFrame
from home.models import Sprite

#debugging

import pprint

def index(request):
    t = loader.get_template("samlite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
    
def save_image(request):
    image_string = request.POST[u"image_string"]
    image_type = request.POST[u"image_type"]
    if image_type == 'AnimationFrame':
        image_class = AnimationFrame
    elif image_type != 'Sprite':
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
