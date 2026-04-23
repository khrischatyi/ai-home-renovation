"""payments: add Stripe Checkout columns, make user_id nullable

Revision ID: 0002_payments_stripe_checkout
Revises: 0001_baseline
Create Date: 2026-04-22
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_payments_stripe_checkout"
down_revision: Union[str, None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make user_id nullable so anonymous users can pay.
    op.alter_column("payments", "user_id", existing_type=postgresql.UUID(), nullable=True)

    op.add_column(
        "payments",
        sa.Column("stripe_checkout_session_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "payments",
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "payments",
        sa.Column("failure_reason", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "payments",
        sa.Column(
            "currency",
            sa.String(length=3),
            nullable=False,
            server_default=sa.text("'usd'"),
        ),
    )
    op.add_column(
        "payments",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_index(
        "ix_payments_stripe_checkout_session_id",
        "payments",
        ["stripe_checkout_session_id"],
    )
    op.create_index("ix_payments_session_id", "payments", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_payments_session_id", table_name="payments")
    op.drop_index("ix_payments_stripe_checkout_session_id", table_name="payments")
    op.drop_column("payments", "updated_at")
    op.drop_column("payments", "currency")
    op.drop_column("payments", "failure_reason")
    op.drop_column("payments", "session_id")
    op.drop_column("payments", "stripe_checkout_session_id")
    op.alter_column("payments", "user_id", existing_type=postgresql.UUID(), nullable=False)
