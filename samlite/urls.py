from django.conf.urls import patterns, url

from samlite import views

urlpatterns = patterns("",
    url(r"^$", views.index, name="index"),
    url(r"^save_frame$", views.save_frame, name="save_frame")
)
