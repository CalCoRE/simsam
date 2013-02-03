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
    url(r"^simlite/", "simlite.views.index"),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
