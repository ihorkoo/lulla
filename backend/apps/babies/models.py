from __future__ import annotations

import uuid
from datetime import date

from django.conf import settings
from django.db import models


class Baby(models.Model):
    """A baby profile linked to a parent user account.

    `gestational_age_weeks` is weeks at birth (22..41). Together with `dob`
    it lets the system compute corrected age — see `corrected_age()`.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="babies",
    )
    name = models.CharField(max_length=120)
    dob = models.DateField()
    gestational_age_weeks = models.PositiveSmallIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["parent", "-created_at"])]
        constraints = [
            models.CheckConstraint(
                check=models.Q(gestational_age_weeks__gte=22)
                & models.Q(gestational_age_weeks__lte=41),
                name="baby_ga_weeks_range",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} (GA {self.gestational_age_weeks}w)"

    @property
    def is_preterm(self) -> bool:
        return self.gestational_age_weeks < 37

    def corrected_age_days(self, on: date | None = None) -> int:
        """Days of corrected age. `corrected = chronological - (40 - GA)*7`.

        Returns chronological for term babies (GA >= 40) and non-negative.
        """
        ref = on or date.today()
        chrono = (ref - self.dob).days
        correction = max(0, (40 - self.gestational_age_weeks)) * 7
        return max(0, chrono - correction)

    def chronological_age_days(self, on: date | None = None) -> int:
        ref = on or date.today()
        return (ref - self.dob).days
