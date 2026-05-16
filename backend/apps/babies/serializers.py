from __future__ import annotations

from rest_framework import serializers

from .models import Baby


class BabySerializer(serializers.ModelSerializer):
    chronological_age_days = serializers.SerializerMethodField()
    corrected_age_days = serializers.SerializerMethodField()
    is_preterm = serializers.BooleanField(read_only=True)

    class Meta:
        model = Baby
        fields = (
            "id",
            "name",
            "dob",
            "gestational_age_weeks",
            "is_preterm",
            "chronological_age_days",
            "corrected_age_days",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_preterm", "created_at", "updated_at")

    def get_chronological_age_days(self, obj: Baby) -> int:
        return obj.chronological_age_days()

    def get_corrected_age_days(self, obj: Baby) -> int:
        return obj.corrected_age_days()

    def validate_gestational_age_weeks(self, value: int) -> int:
        if not (22 <= value <= 41):
            raise serializers.ValidationError("Gestational age must be 22-41 weeks.")
        return value
