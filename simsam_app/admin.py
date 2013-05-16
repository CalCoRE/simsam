from django.contrib import admin

from simsam_app.models import *

admin.site.register(Project)
admin.site.register(SimsamUser)
admin.site.register(Animation)
admin.site.register(AnimationFrame)
admin.site.register(Simulation)
admin.site.register(SimulationState)
admin.site.register(SimulationObject)
