from app.worker.celery_app import celery_app


@celery_app.task(bind=True, name="sync_contractor_data", max_retries=3)
def sync_contractor_data(self, contractor_id: str | None = None) -> dict:
    """Sync contractor data from external APIs.

    This task will fetch data from sources like:
    - State licensing boards
    - BBB
    - Google Reviews
    - Yelp
    - HomeAdvisor / Angi

    Currently a placeholder that returns a mock result.
    """
    return {
        "status": "completed",
        "contractor_id": contractor_id,
        "message": "Contractor data sync placeholder - external API integration pending",
        "sources_checked": 0,
    }
