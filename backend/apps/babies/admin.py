from django.contrib import admin

from .models import Baby


@admin.register(Baby)
class BabyAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "dob", "gestational_age_weeks", "is_preterm", "created_at")
    list_filter = ("gestational_age_weeks",)
    search_fields = ("name", "parent__email")
    raw_id_fields = ("parent",)
    readonly_fields = ("id", "created_at", "updated_at")
