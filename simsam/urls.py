from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'simsam.views.home', name='home'),
    # url(r'^simsam/', include('simsam.foo.urls')),
    url(r"^$", "home.views.index"),
    url(r"^sandbox$", "home.views.sandbox"),
    url(r"^samlite/", include("samlite.urls")),
    url(r"^simlite/?$", "simlite.views.index"),
    url(r"^simlite/sprite/?$", "simlite.views.sprite"),
    url(r"^login/$", "home.views.login_user"),
    url(r"^login/openproject$", "samlite.views.openproject"),
    url(r"^login/make_project$", "samlite.views.make_project"),
    url(r"^login/chooseproject/$", "samlite.views.chooseproject"),
    url(r"^login/newanim", "samlite.views.newanim"),
    url(r"^login/openAnim", "samlite.views.openAnim"),
    url(r"^login/logout/", "samlite.views.logout_user"),
    url(r"^login/chooseanim$", "samlite.views.chooseanim"),
    #url(r"^(.*)", include("samlite.urls")),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
