# Create your views here.
from django.http import HttpResponse
from django.template import Context, loader, RequestContext


def index(request):
    t = loader.get_template("simlite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
#return HttpResponse("Hello, world.")


def sprite(request):
    t = loader.get_template("sprite.html")
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))
