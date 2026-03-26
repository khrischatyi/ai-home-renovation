from dataclasses import dataclass


@dataclass
class CostEstimate:
    low: float
    high: float
    confidence: float


# Regional cost multipliers by zip code prefix (first 3 digits).
# Higher cost areas get a higher multiplier.
_ZIP_MULTIPLIERS: dict[str, float] = {
    "100": 1.45,  # New York, NY
    "101": 1.40,
    "102": 1.35,
    "900": 1.35,  # Los Angeles, CA
    "941": 1.40,  # San Francisco, CA
    "606": 1.20,  # Chicago, IL
    "770": 1.05,  # Houston, TX
    "331": 1.10,  # Miami, FL
    "981": 1.25,  # Seattle, WA
    "021": 1.30,  # Boston, MA
}

# Scope size multipliers applied to cost range.
_SCOPE_MULTIPLIERS: dict[str, float] = {
    "small": 0.7,
    "medium": 1.0,
    "large": 1.4,
    "full": 1.8,
}


class CostEstimationEngine:
    BASE_RANGES: dict[str, tuple[float, float]] = {
        "bathroom": (8_000.0, 25_000.0),
        "kitchen": (12_000.0, 45_000.0),
        "windows": (3_000.0, 15_000.0),
        "roofing": (5_000.0, 20_000.0),
    }

    def estimate(self, project_type: str, zip_code: str, scope: dict) -> CostEstimate:
        base_low, base_high = self.BASE_RANGES.get(
            project_type, (5_000.0, 20_000.0)
        )

        zip_mult = self._zip_multiplier(zip_code)
        scope_mult = self._scope_multiplier(scope)

        low = round(base_low * zip_mult * scope_mult, 2)
        high = round(base_high * zip_mult * scope_mult, 2)

        # Confidence is higher when we have more scope data and a known zip multiplier
        confidence = self._calculate_confidence(zip_code, scope, project_type)

        return CostEstimate(low=low, high=high, confidence=confidence)

    def _zip_multiplier(self, zip_code: str) -> float:
        prefix = zip_code[:3] if len(zip_code) >= 3 else zip_code
        return _ZIP_MULTIPLIERS.get(prefix, 1.0)

    def _scope_multiplier(self, scope: dict) -> float:
        size = scope.get("size", "medium")
        return _SCOPE_MULTIPLIERS.get(size, 1.0)

    def _calculate_confidence(self, zip_code: str, scope: dict, project_type: str) -> float:
        confidence = 0.5

        # Known project type adds confidence
        if project_type in self.BASE_RANGES:
            confidence += 0.15

        # Known zip area adds confidence
        prefix = zip_code[:3] if len(zip_code) >= 3 else zip_code
        if prefix in _ZIP_MULTIPLIERS:
            confidence += 0.15

        # More scope detail adds confidence
        scope_keys = len(scope)
        if scope_keys >= 3:
            confidence += 0.15
        elif scope_keys >= 1:
            confidence += 0.05

        return min(round(confidence, 2), 0.95)
