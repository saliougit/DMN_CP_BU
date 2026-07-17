from django.contrib import admin
from .models import Faculte, Filiere, Niveau


class FiliereInline(admin.TabularInline):
    model  = Filiere
    extra  = 0
    fields = ("nom",)


@admin.register(Faculte)
class FaculteAdmin(admin.ModelAdmin):
    list_display  = ("code", "nom")
    search_fields = ("nom", "code")
    ordering      = ("code",)
    inlines       = [FiliereInline]


@admin.register(Filiere)
class FiliereAdmin(admin.ModelAdmin):
    list_display  = ("nom", "faculte")
    list_filter   = ("faculte",)
    search_fields = ("nom",)


@admin.register(Niveau)
class NiveauAdmin(admin.ModelAdmin):
    list_display = ("nom", "cycle", "ordre")
    list_filter  = ("cycle",)
    ordering     = ("ordre",)
