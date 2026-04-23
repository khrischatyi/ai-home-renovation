"""baseline

Empty revision representing the pre-Stripe-integration schema. The tables
already exist in the database; this file only re-anchors the Alembic
history chain so future migrations can be layered cleanly.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-04-22
"""
from __future__ import annotations

from typing import Sequence, Union

revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
