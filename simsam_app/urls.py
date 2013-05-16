from django.conf.urls import patterns, url

from simsam_app import views

urlpatterns = patterns("",
    #url(r"^$", views.index, name="index"),
    url(r"^login/$", views.login_user, name="login_user"),
    url(r"^$", views.index, name="index"),
    url(r"^save_image$", views.save_image, name="save_image"),
    url(r"^save_frame_sequence$", views.save_frame_sequence,
        name="save_frame_sequence"),
    url(r"^openproject$", views.openproject, name="openproject"),
    url(r"^chooseproject/?$", views.chooseproject, name="chooseproject"),
    url(r"^make_project$", views.make_project, name="make_project"),
    url(r"^newanim", views.newanim, name="newanim"),
    url(r"^openAnim", views.openAnim, name="openAnim"),
    url(r"^logout/", views.logout_user, name="logout_user"),
    url(r"^chooseanim$", views.chooseanim, name="chooseanim"),
    #url(r"^(?P<frame_registry>\d+)/$", views.save_project, name="save_project")
)
