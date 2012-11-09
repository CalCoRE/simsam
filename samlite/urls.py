from django.conf.urls import patterns, url

from samlite import views

urlpatterns = patterns("",
    url(r"^$", views.index, name="index")
)
