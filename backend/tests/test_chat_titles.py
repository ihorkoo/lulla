from __future__ import annotations

from datetime import date

import pytest

from apps.accounts.models import User
from apps.babies.models import Baby
from apps.chat.models import Conversation
from apps.chat.services import _persist_user_message, _suggest_conversation_title


@pytest.mark.django_db
def test_first_user_message_sets_conversation_title() -> None:
    user = User.objects.create_user(email="parent@example.com", password="test-password-123")
    baby = Baby.objects.create(
        parent=user,
        name="Mia",
        dob=date(2024, 1, 1),
        gestational_age_weeks=34,
    )
    conversation = Conversation.objects.create(user=user, baby=baby, title="")

    _persist_user_message(conversation, "How much vitamin D is usually given each day?")

    conversation.refresh_from_db()
    assert conversation.title == "How much vitamin D is usually given each day?"


@pytest.mark.django_db
def test_existing_conversation_title_is_not_overwritten() -> None:
    user = User.objects.create_user(email="parent@example.com", password="test-password-123")
    baby = Baby.objects.create(
        parent=user,
        name="Mia",
        dob=date(2024, 1, 1),
        gestational_age_weeks=34,
    )
    conversation = Conversation.objects.create(user=user, baby=baby, title="Custom title")

    _persist_user_message(conversation, "A new question that should not replace the title")

    conversation.refresh_from_db()
    assert conversation.title == "Custom title"


def test_suggest_conversation_title_normalizes_and_truncates() -> None:
    content = "  This is a very long first message\nwith extra spacing that should become a clean title and then be trimmed before it gets too long for the conversation list.  "

    title = _suggest_conversation_title(content, max_length=60)

    assert title == "This is a very long first message with extra spacing that..."
