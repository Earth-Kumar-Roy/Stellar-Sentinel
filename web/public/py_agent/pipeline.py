import os
import math
from datetime import datetime, timezone
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "isolation_forest.joblib")


class FeatureExtractor:
    """
    Transforms on-chain intent parameters and off-chain ledger historical records
    into a normalized 7-dimensional numeric feature vector.
    """
    @staticmethod
    def extract_features(
        amount: float,
        daily_limit: float,
        destination_24h_count: int,
        recipient_age_days: float,
        timestamp_epoch: int,
        purpose_hash_hex: str,
        is_independent_wallet: bool,
        historical_transfers_to_wallet: int
    ) -> list[float]:
        # f1: Log Amount Ratio (normalized to baseline 100.0)
        baseline = 100.0
        clamped_amount = max(amount, 0.0000001)
        f1_amount_ratio = math.log10(clamped_amount / baseline + 1.0)

        # f2: Destination Velocity (tx count in last 24h)
        f2_dest_velocity = min(float(destination_24h_count) / 10.0, 5.0)

        # f3: Recipient Exposure Age (1.0 = established >= 30 days, 0.0 = fresh)
        f3_recipient_age = min(max(recipient_age_days, 0.0) / 30.0, 1.0)

        # f4: Circadian Temporal Offset (IST UTC+5:30)
        dt = datetime.fromtimestamp(timestamp_epoch, tz=timezone.utc)
        hour_ist = (dt.hour + 5.5) % 24
        # Higher values for off-hours transfers (e.g. 12:00 AM - 5:00 AM)
        if 0.0 <= hour_ist <= 5.0:
            f4_circadian_offset = 1.0
        elif 9.0 <= hour_ist <= 18.0:
            f4_circadian_offset = 0.1
        else:
            f4_circadian_offset = 0.5

        # f5: Daily Velocity Consumption Ratio
        safe_daily_limit = max(daily_limit, 1.0)
        f5_velocity_consumption = min(amount / safe_daily_limit, 2.0)

        # f6: Shannon Entropy of Purpose Hash (validates randomness/integrity)
        f6_entropy = 0.0
        if purpose_hash_hex:
            prob = [purpose_hash_hex.count(c) / len(purpose_hash_hex) for c in set(purpose_hash_hex)]
            f6_entropy = -sum(p * math.log2(p) for p in prob) / 4.0  # normalized hex entropy

        # f7: Independent Recipient Repetition Index
        # Small one-off payments to new wallets are normal; >= 3 payments to unverified wallets indicates drain/structuring
        if not is_independent_wallet:
            f7_repetition_index = 0.0  # Verified organization
        elif historical_transfers_to_wallet <= 2 and amount <= 100.0:
            f7_repetition_index = 0.2  # Micro-testing / allowed one-off
        else:
            # Scaled up for repeated transfers to unverified independent wallets
            f7_repetition_index = min(0.4 + (historical_transfers_to_wallet * 0.2), 1.0)

        return [
            f1_amount_ratio,
            f2_dest_velocity,
            f3_recipient_age,
            f4_circadian_offset,
            f5_velocity_consumption,
            f6_entropy,
            f7_repetition_index
        ]


class AnomalyDetector:
    """
    Low-memory Isolation Forest model loader and inference engine (<15MB RAM).
    """
    def __init__(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.model = self._load_or_initialize_model()

    def _load_or_initialize_model(self) -> IsolationForest:
        if os.path.exists(MODEL_PATH):
            try:
                return joblib.load(MODEL_PATH)
            except Exception:
                pass

        # Seed initial synthetic baseline spanning legitimate business patterns
        np.random.seed(42)
        normal_samples = np.random.normal(
            loc=[0.5, 0.2, 0.8, 0.2, 0.05, 0.9, 0.1],
            scale=[0.2, 0.1, 0.2, 0.1, 0.02, 0.05, 0.05],
            size=(500, 7)
        )
        model = IsolationForest(
            n_estimators=50,
            contamination=0.05,
            random_state=42,
            n_jobs=1
        )
        model.fit(normal_samples)
        joblib.dump(model, MODEL_PATH)
        return model

    def score_anomaly(self, feature_vector: list[float]) -> float:
        """
        Returns an anomaly score normalized between 0.0 (benign) and 1.0 (anomalous).
        """
        X = np.array([feature_vector])
        # decision_function returns negative values for outliers, positive for inliers
        raw_score = self.model.decision_function(X)[0]
        # Sigmoid-style normalization into [0.0, 1.0]
        normalized_score = 1.0 / (1.0 + math.exp(raw_score * 4.0))
        return float(min(max(normalized_score, 0.0), 1.0))