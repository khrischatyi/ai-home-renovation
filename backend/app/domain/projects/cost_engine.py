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

# Scope level multipliers
_LEVEL_MULTIPLIERS: dict[str, float] = {
    # Bathroom
    "full remodel": 1.6,
    "partial update": 1.0,
    "fixtures only": 0.5,
    "tile work": 0.6,
    # Kitchen
    "cabinet refacing": 0.6,
    "countertops only": 0.4,
    "appliance upgrade": 0.5,
    # Windows
    "1-3": 0.5,
    "4-6": 1.0,
    "7-10": 1.5,
    "10+": 2.0,
    # Roofing
    "full replacement": 1.6,
    "partial repair": 0.6,
    "inspection only": 0.15,
    "gutter work": 0.4,
}

# Size multipliers parsed from the size string
_SIZE_MULTIPLIERS: dict[str, float] = {
    "small": 0.7,
    "medium": 1.0,
    "large": 1.4,
}

# Budget range caps - used to clamp estimates to user expectations
_BUDGET_CAPS: dict[str, tuple[float, float]] = {
    "Under $5K": (0, 5_000),
    "$5K-$15K": (5_000, 15_000),
    "$15K-$30K": (15_000, 30_000),
    "$30K-$50K": (30_000, 50_000),
    "$50K+": (50_000, 200_000),
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
        level_mult = self._level_multiplier(scope)

        low = round(base_low * zip_mult * scope_mult * level_mult, 2)
        high = round(base_high * zip_mult * scope_mult * level_mult, 2)

        # If user provided a budget range, adjust confidence but don't clamp the estimate
        # The estimate should reflect real costs, not user budget
        confidence = self._calculate_confidence(zip_code, scope, project_type)

        return CostEstimate(low=low, high=high, confidence=confidence)

    def _zip_multiplier(self, zip_code: str) -> float:
        prefix = zip_code[:3] if len(zip_code) >= 3 else zip_code
        return _ZIP_MULTIPLIERS.get(prefix, 1.0)

    def _scope_multiplier(self, scope: dict) -> float:
        size_str = scope.get("size", "")
        # Parse size category from strings like "Small (under 40 sq ft)" or "Medium (1000-2000 sq ft)"
        size_lower = size_str.lower() if size_str else ""
        for key in _SIZE_MULTIPLIERS:
            if size_lower.startswith(key):
                return _SIZE_MULTIPLIERS[key]
        return 1.0

    def _level_multiplier(self, scope: dict) -> float:
        level = scope.get("level", "")
        return _LEVEL_MULTIPLIERS.get(level.lower(), 1.0) if level else 1.0

    def _calculate_confidence(self, zip_code: str, scope: dict, project_type: str) -> float:
        confidence = 0.5

        # Known project type adds confidence
        if project_type in self.BASE_RANGES:
            confidence += 0.10

        # Known zip area adds confidence
        prefix = zip_code[:3] if len(zip_code) >= 3 else zip_code
        if prefix in _ZIP_MULTIPLIERS:
            confidence += 0.10

        # Scope level adds confidence
        if scope.get("level"):
            confidence += 0.05

        # Size info adds confidence
        if scope.get("size") and scope["size"] != "Not sure":
            confidence += 0.05

        # Work areas add confidence
        work_areas = scope.get("work_areas", [])
        if len(work_areas) > 0:
            confidence += 0.05

        # Budget range adds confidence (user has thought about costs)
        if scope.get("budget_range") and scope["budget_range"] != "Not sure yet":
            confidence += 0.05

        # Property info adds confidence
        if scope.get("property_type"):
            confidence += 0.03
        if scope.get("property_age"):
            confidence += 0.02

        # More scope detail adds confidence
        scope_keys = len(scope)
        if scope_keys >= 6:
            confidence += 0.05
        elif scope_keys >= 3:
            confidence += 0.03

        return min(round(confidence, 2), 0.95)
