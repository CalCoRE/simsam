from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings

import os

import simsam_app

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()


urlpatterns = patterns('',
    # Examples:
    # url(r'^simsam/', include('simsam.foo.urls')),
    url(r"^$", simsam_app.views.login_user),
    url(r"^sandbox/?$", simsam_app.views.sandbox),
    url(r"^logout/?$", simsam_app.views.logout_user),
    url(r"^chooseproject/?$", simsam_app.views.chooseproject),
    url(r"^make_project/?$", simsam_app.views.make_project),
    url(r"^newanim/?$", simsam_app.views.newanim),
    url(r"^openAnim/?$", simsam_app.views.openAnim),
    url(r"^chooseanim/?$", simsam_app.views.chooseanim),
    url(r"^app/?$", simsam_app.views.app),
    url(r"^save_image/?$", simsam_app.views.save_image),
    url(r"^delete_image/?$", simsam_app.views.delete_image),
    url(r"^save_frame_sequence/?$", simsam_app.views.save_frame_sequence),
    url(r"^save_sim_state/?$", simsam_app.views.save_sim_state),
    url(r"^load_sim_state/?$", simsam_app.views.load_sim_state),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += static(
    settings.MEDIA_URL + 'sam_frames/',
    document_root=os.path.join(settings.MEDIA_ROOT, 'sam_frames')
)
urlpatterns += static(
    settings.MEDIA_URL + 'sprites/',
    document_root=os.path.join(settings.MEDIA_ROOT, 'sprites')
)

urlpatterns += staticfiles_urlpatterns()
