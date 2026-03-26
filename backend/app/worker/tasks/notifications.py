from app.worker.celery_app import celery_app


@celery_app.task(bind=True, name="send_notification", max_retries=3)
def send_notification(
    self,
    user_id: str,
    notification_type: str,
    payload: dict | None = None,
) -> dict:
    """Send a notification to a user.

    Notification types:
    - contractor_matched: New contractor matches found
    - payment_confirmed: Payment was processed
    - project_updated: Project status changed

    Currently a placeholder that returns a mock result.
    """
    return {
        "status": "sent",
        "user_id": user_id,
        "notification_type": notification_type,
        "message": "Notification placeholder - delivery integration pending",
    }
