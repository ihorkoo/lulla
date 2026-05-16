from __future__ import annotations

from datetime import date

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.babies.models import Baby
from apps.chat.models import Conversation


@pytest.mark.django_db
def test_create_conversation_requires_baby_profile() -> None:
    user = User.objects.create_user(email="parent@example.com", password="test-password-123")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/v1/chat/conversations", {"title": ""}, format="json")

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["code"] == "BABY_PROFILE_REQUIRED"
    assert Conversation.objects.count() == 0


@pytest.mark.django_db
def test_create_conversation_links_latest_baby_profile() -> None:
    user = User.objects.create_user(email="parent@example.com", password="test-password-123")
    older_baby = Baby.objects.create(
        parent=user,
        name="Mia",
        dob=date(2024, 1, 1),
        gestational_age_weeks=34,
    )
    latest_baby = Baby.objects.create(
        parent=user,
        name="Leo",
        dob=date(2024, 2, 1),
        gestational_age_weeks=35,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/v1/chat/conversations", {"title": ""}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    conversation = Conversation.objects.get(pk=response.json()["id"])
    assert conversation.baby_id == latest_baby.id
    assert conversation.baby_id != older_baby.id
