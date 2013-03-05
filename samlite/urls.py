from django.conf.urls import patterns, url

from samlite import views

urlpatterns = patterns("",
    url(r"^$", views.index, name="index"),
    url(r"^save_image$", views.save_image, name="save_image"),
    url(r"^login/$", views.login_user, name="login_user"),
    url(r"^logout/", views.logout_user, name="logout_user"),
    url(r"^openproject$", views.openproject, name="openproject"),
    url(r"^chooseproject/$", views.chooseproject, name="chooseproject"),
    url(r"^make_project$", views.make_project, name="make_project"),
    #url(r"^(?P<frame_registry>\d+)/$", views.save_project, name="save_project")
)
