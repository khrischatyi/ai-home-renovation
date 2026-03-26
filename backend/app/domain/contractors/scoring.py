from dataclasses import dataclass, field


@dataclass
class ContractorScoringEngine:
    review_score_weight: float = 0.30
    sentiment_weight: float = 0.20
    license_weight: float = 0.20
    complaint_weight: float = 0.15
    longevity_weight: float = 0.10
    engagement_weight: float = 0.05

    def calculate_composite_score(self, contractor_data: dict) -> float:
        """Calculate a composite score from 0-100 for a contractor.

        contractor_data expected keys:
            avg_rating: float (0-5)
            sentiment_score: float (0-1)
            license_active: bool
            insurance_verified: bool
            complaint_count: int
            years_in_business: int
            response_rate: float (0-1)
        """
        review_score = self._normalize_rating(contractor_data.get("avg_rating", 0))
        sentiment_score = contractor_data.get("sentiment_score", 0.5) * 100
        license_score = self._license_score(
            contractor_data.get("license_active", False),
            contractor_data.get("insurance_verified", False),
        )
        complaint_score = self._complaint_score(contractor_data.get("complaint_count", 0))
        longevity_score = self._longevity_score(contractor_data.get("years_in_business", 0))
        engagement_score = contractor_data.get("response_rate", 0.5) * 100

        composite = (
            review_score * self.review_score_weight
            + sentiment_score * self.sentiment_weight
            + license_score * self.license_weight
            + complaint_score * self.complaint_weight
            + longevity_score * self.longevity_weight
            + engagement_score * self.engagement_weight
        )

        return round(min(max(composite, 0), 100), 2)

    def _normalize_rating(self, rating: float) -> float:
        """Normalize a 0-5 star rating to a 0-100 scale."""
        return (rating / 5.0) * 100

    def _license_score(self, license_active: bool, insurance_verified: bool) -> float:
        score = 0.0
        if license_active:
            score += 60.0
        if insurance_verified:
            score += 40.0
        return score

    def _complaint_score(self, complaint_count: int) -> float:
        """Fewer complaints = higher score."""
        if complaint_count == 0:
            return 100.0
        elif complaint_count <= 2:
            return 75.0
        elif complaint_count <= 5:
            return 50.0
        elif complaint_count <= 10:
            return 25.0
        return 0.0

    def _longevity_score(self, years: int) -> float:
        """More years = higher score, capped at 20 years."""
        return min(years / 20.0, 1.0) * 100
