"""
Masarek AI Service — FastAPI + scikit-learn ML recommendation engine
Run: uvicorn main:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os
import random
from typing import List, Dict, Optional

app = FastAPI(title="Masarek AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── CATALOGUE ────────────────────────────────────────────────────────────────

SPECIALTIES = [
    {
        "id": "sp_isil",
        "nameAr": "هندسة الأنظمة المعلوماتية والبرمجيات",
        "nameFr": "ISIL",
        "fieldAr": "العلوم والتكنولوجيا",
        "domain": "TECH_ING",
        "minGrade": 13.0,
        "durationYears": 5,
        "careerPaths": ["مهندس برمجيات", "مطور ويب", "محلل أنظمة", "خبير أمن معلومات"],
        "descriptionAr": "تخصص يجمع بين الرياضيات والبرمجة والهندسة لتطوير أنظمة معلوماتية متكاملة.",
    },
    {
        "id": "sp_gsi",
        "nameAr": "إدارة الأنظمة المعلوماتية",
        "nameFr": "GSI",
        "fieldAr": "العلوم والتكنولوجيا",
        "domain": "TECH_ING",
        "minGrade": 12.0,
        "durationYears": 5,
        "careerPaths": ["مدير أنظمة", "محلل أعمال", "مدير مشاريع IT", "مستشار تقني"],
        "descriptionAr": "يجمع بين إدارة الأعمال والتكنولوجيا لتحقيق التحول الرقمي.",
    },
    {
        "id": "sp_medecine",
        "nameAr": "الطب العام",
        "nameFr": "Médecine Générale",
        "fieldAr": "العلوم الطبية",
        "domain": "MEDECINE",
        "minGrade": 16.0,
        "durationYears": 7,
        "careerPaths": ["طبيب عام", "طبيب متخصص", "باحث طبي", "مدير مستشفى"],
        "descriptionAr": "دراسة شاملة للعلوم الطبية وتشخيص وعلاج الأمراض.",
    },
    {
        "id": "sp_pharmacie",
        "nameAr": "الصيدلة",
        "nameFr": "Pharmacie",
        "fieldAr": "العلوم الطبية",
        "domain": "MEDECINE",
        "minGrade": 15.5,
        "durationYears": 5,
        "careerPaths": ["صيدلاني", "باحث في الدواء", "مسؤول مخبر", "مستشار صحي"],
        "descriptionAr": "دراسة الأدوية والمركبات الكيميائية وتأثيرها على جسم الإنسان.",
    },
    {
        "id": "sp_droit",
        "nameAr": "الحقوق والعلوم السياسية",
        "nameFr": "Droit et Sciences Politiques",
        "fieldAr": "العلوم القانونية والسياسية",
        "domain": "DROIT",
        "minGrade": 11.0,
        "durationYears": 4,
        "careerPaths": ["محامٍ", "قاضٍ", "مستشار قانوني", "دبلوماسي"],
        "descriptionAr": "دراسة القوانين والعلوم السياسية لحماية الحقوق وتحقيق العدالة.",
    },
    {
        "id": "sp_genie_civil",
        "nameAr": "الهندسة المدنية",
        "nameFr": "Génie Civil",
        "fieldAr": "العلوم والتكنولوجيا",
        "domain": "TECH_ING",
        "minGrade": 12.0,
        "durationYears": 5,
        "careerPaths": ["مهندس مدني", "مدير مشاريع بناء", "مستشار هندسي", "مخطط عمراني"],
        "descriptionAr": "تصميم وبناء البنية التحتية والمباني والطرق والجسور.",
    },
    {
        "id": "sp_economie",
        "nameAr": "العلوم الاقتصادية",
        "nameFr": "Sciences Économiques",
        "fieldAr": "العلوم الاقتصادية والتجارية",
        "domain": "ECONOMIE",
        "minGrade": 11.0,
        "durationYears": 4,
        "careerPaths": ["اقتصادي", "محلل مالي", "مستشار أعمال", "رائد أعمال"],
        "descriptionAr": "دراسة النظريات الاقتصادية والتحليل المالي وآليات السوق.",
    },
    {
        "id": "sp_math",
        "nameAr": "الرياضيات",
        "nameFr": "Mathématiques",
        "fieldAr": "العلوم الأساسية",
        "domain": "SCIENCES",
        "minGrade": 14.0,
        "durationYears": 3,
        "careerPaths": ["أستاذ رياضيات", "باحث رياضي", "محلل إحصائي", "مهندس نماذج مالية"],
        "descriptionAr": "دراسة متعمقة في الرياضيات البحتة والتطبيقية والإحصاء.",
    },
    {
        "id": "sp_lettres",
        "nameAr": "اللغة والأدب العربي",
        "nameFr": "Langue et Littérature Arabes",
        "fieldAr": "الآداب واللغات",
        "domain": "LETTRES_ARTS",
        "minGrade": 10.0,
        "durationYears": 3,
        "careerPaths": ["أستاذ لغة عربية", "صحفي", "كاتب", "مترجم"],
        "descriptionAr": "دراسة اللغة العربية وآدابها وتاريخها وتطورها عبر العصور.",
    },
    {
        "id": "sp_staps",
        "nameAr": "علوم وتقنيات النشاطات البدنية والرياضية",
        "nameFr": "STAPS",
        "fieldAr": "العلوم الرياضية والصحية",
        "domain": "SCIENCES_SOC",
        "minGrade": 10.0,
        "durationYears": 3,
        "careerPaths": ["مدرّب رياضي", "أستاذ تربية بدنية", "مدير نادٍ رياضي", "معالج حركي"],
        "descriptionAr": "دراسة العلوم الرياضية والتدريب وتحسين الأداء البدني والصحة الرياضية.",
    },
    {
        "id": "sp_architecture",
        "nameAr": "العمارة",
        "nameFr": "Architecture",
        "fieldAr": "الفنون والهندسة",
        "domain": "TECH_ING",
        "minGrade": 12.0,
        "durationYears": 5,
        "careerPaths": ["مهندس معماري", "مصمم داخلي", "مخطط عمراني", "خبير تراث"],
        "descriptionAr": "الجمع بين الفن والهندسة لتصميم الفضاءات والمباني.",
    },
    {
        "id": "sp_biologie",
        "nameAr": "علوم الطبيعة والحياة",
        "nameFr": "Sciences de la Nature et de la Vie",
        "fieldAr": "العلوم الأساسية",
        "domain": "SCIENCES",
        "minGrade": 11.0,
        "durationYears": 3,
        "careerPaths": ["باحث بيولوجي", "تقني مختبر", "بيئي", "مفتش صحة عامة"],
        "descriptionAr": "دراسة الكائنات الحية وبيئتها وتطورها وتطبيقاتها في الصحة والزراعة.",
    },
]

SPECIALTY_IDS = [s["id"] for s in SPECIALTIES]
SPEC_MAP = {s["id"]: s for s in SPECIALTIES}

ALL_INTERESTS = [
    "sciences", "tech", "medicine", "arts", "business",
    "law", "education", "sports", "env", "languages", "politics", "engineering",
]

ALL_BAC_SERIES = [
    "sciences-exp", "math", "tech-math",
    "letters-philo", "languages", "gestion-eco",
]

ALL_WORK_ENVS = ["office", "field", "people", "lab"]

ALL_STRENGTH_KEYS = [
    "logic", "creativity", "comms", "leadership",
    "math", "writing", "problem", "org",
]

# ─── SYNTHETIC TRAINING DATA GENERATOR ───────────────────────────────────────

# Each specialty has a "typical student profile" — used to generate
# realistic synthetic training samples

SPECIALTY_PROFILES = {
    "sp_isil": {
        "series": ["math", "sciences-exp", "tech-math"],
        "grade_range": (13, 18),
        "top_interests": ["tech", "engineering", "sciences"],
        "top_strengths": {"logic": (4, 5), "math": (4, 5), "problem": (3, 5), "creativity": (2, 4)},
        "work_env": ["office", "lab"],
        "top_priorities": ["الراتب المرتفع", "الإبداع والابتكار"],
    },
    "sp_gsi": {
        "series": ["math", "sciences-exp", "tech-math", "gestion-eco"],
        "grade_range": (12, 17),
        "top_interests": ["tech", "business", "engineering"],
        "top_strengths": {"logic": (3, 5), "org": (3, 5), "leadership": (3, 5), "comms": (2, 4)},
        "work_env": ["office", "people"],
        "top_priorities": ["الراتب المرتفع", "الاستقرار الوظيفي"],
    },
    "sp_medecine": {
        "series": ["sciences-exp"],
        "grade_range": (16, 20),
        "top_interests": ["medicine", "sciences"],
        "top_strengths": {"logic": (4, 5), "comms": (3, 5), "org": (4, 5), "problem": (3, 5)},
        "work_env": ["people", "lab"],
        "top_priorities": ["التأثير في المجتمع", "الاستقرار الوظيفي"],
    },
    "sp_pharmacie": {
        "series": ["sciences-exp"],
        "grade_range": (15, 20),
        "top_interests": ["medicine", "sciences"],
        "top_strengths": {"logic": (4, 5), "org": (3, 5), "problem": (3, 5)},
        "work_env": ["lab", "people"],
        "top_priorities": ["الاستقرار الوظيفي", "الراتب المرتفع"],
    },
    "sp_droit": {
        "series": ["letters-philo", "languages", "gestion-eco"],
        "grade_range": (11, 17),
        "top_interests": ["law", "politics"],
        "top_strengths": {"writing": (4, 5), "comms": (4, 5), "leadership": (3, 5)},
        "work_env": ["people", "office"],
        "top_priorities": ["التأثير في المجتمع", "الاستقرار الوظيفي"],
    },
    "sp_genie_civil": {
        "series": ["math", "tech-math"],
        "grade_range": (12, 17),
        "top_interests": ["engineering"],
        "top_strengths": {"math": (4, 5), "logic": (3, 5), "org": (3, 5)},
        "work_env": ["field", "lab"],
        "top_priorities": ["الراتب المرتفع", "الاستقرار الوظيفي"],
    },
    "sp_economie": {
        "series": ["gestion-eco", "sciences-exp", "math"],
        "grade_range": (11, 16),
        "top_interests": ["business", "politics"],
        "top_strengths": {"logic": (3, 5), "org": (3, 5), "leadership": (2, 4)},
        "work_env": ["office", "people"],
        "top_priorities": ["الراتب المرتفع", "العمل الحر"],
    },
    "sp_math": {
        "series": ["math", "sciences-exp"],
        "grade_range": (14, 20),
        "top_interests": ["sciences", "tech"],
        "top_strengths": {"math": (5, 5), "logic": (4, 5), "problem": (4, 5)},
        "work_env": ["lab", "office"],
        "top_priorities": ["الإبداع والابتكار", "الاستقرار الوظيفي"],
    },
    "sp_lettres": {
        "series": ["letters-philo", "languages"],
        "grade_range": (10, 16),
        "top_interests": ["languages", "arts", "education"],
        "top_strengths": {"writing": (4, 5), "creativity": (3, 5), "comms": (3, 5)},
        "work_env": ["people", "office"],
        "top_priorities": ["التأثير في المجتمع", "الإبداع والابتكار"],
    },
    "sp_staps": {
        "series": ["sciences-exp", "math", "tech-math", "letters-philo", "languages", "gestion-eco"],
        "grade_range": (10, 15),
        "top_interests": ["sports", "education", "medicine"],
        "top_strengths": {"leadership": (3, 5), "comms": (3, 5), "org": (3, 5)},
        "work_env": ["field", "people"],
        "top_priorities": ["التأثير في المجتمع", "السفر والتنقل"],
    },
    "sp_architecture": {
        "series": ["math", "tech-math", "sciences-exp"],
        "grade_range": (12, 17),
        "top_interests": ["arts", "engineering", "env"],
        "top_strengths": {"creativity": (4, 5), "math": (3, 5), "org": (3, 5)},
        "work_env": ["office", "field"],
        "top_priorities": ["الإبداع والابتكار", "الراتب المرتفع"],
    },
    "sp_biologie": {
        "series": ["sciences-exp"],
        "grade_range": (11, 16),
        "top_interests": ["sciences", "env", "medicine"],
        "top_strengths": {"logic": (3, 5), "problem": (3, 5), "org": (3, 5)},
        "work_env": ["lab", "field"],
        "top_priorities": ["التأثير في المجتمع", "الإبداع والابتكار"],
    },
}

ALL_PRIORITIES = [
    "الراتب المرتفع", "الاستقرار الوظيفي", "التأثير في المجتمع",
    "الإبداع والابتكار", "السفر والتنقل", "العمل الحر",
]


def generate_training_sample(spec_id: str, label_score: float, noise: float = 0.0):
    """Generate one synthetic student profile for a given specialty."""
    profile = SPECIALTY_PROFILES[spec_id]
    rng = random.Random()

    # Bac series — mostly matching, sometimes not
    if random.random() < 0.80:
        series = random.choice(profile["series"])
    else:
        series = random.choice(ALL_BAC_SERIES)

    # Grade — normally distributed around the specialty range
    lo, hi = profile["grade_range"]
    grade = np.clip(
        np.random.normal((lo + hi) / 2, (hi - lo) / 4) + noise * random.uniform(-2, 2),
        0, 20,
    )

    # Interests — mostly matching
    interests = []
    for interest in ALL_INTERESTS:
        if interest in profile["top_interests"]:
            interests.append(1 if random.random() < 0.85 else 0)
        else:
            interests.append(1 if random.random() < 0.15 else 0)

    # Strengths — rated 1–5
    strengths = []
    for sk in ALL_STRENGTH_KEYS:
        if sk in profile["top_strengths"]:
            lo_s, hi_s = profile["top_strengths"][sk]
            val = int(np.clip(np.random.normal((lo_s + hi_s) / 2, 0.6), 1, 5))
        else:
            val = int(np.clip(np.random.normal(2.5, 1.0), 1, 5))
        strengths.append(val)

    # Work environment — one-hot
    work_env_vec = [0] * len(ALL_WORK_ENVS)
    if random.random() < 0.80:
        chosen_env = random.choice(profile["work_env"])
    else:
        chosen_env = random.choice(ALL_WORK_ENVS)
    work_env_vec[ALL_WORK_ENVS.index(chosen_env)] = 1

    # Top priority — ordinal index
    if random.random() < 0.75:
        top_priority = random.choice(profile["top_priorities"])
    else:
        top_priority = random.choice(ALL_PRIORITIES)
    priority_idx = ALL_PRIORITIES.index(top_priority) if top_priority in ALL_PRIORITIES else 0

    # Series one-hot
    series_vec = [1 if s == series else 0 for s in ALL_BAC_SERIES]

    feature_vector = series_vec + [grade / 20.0] + interests + strengths + work_env_vec + [priority_idx / 5.0]
    return feature_vector


def build_training_data(n_per_specialty: int = 120):
    """
    Build (X, Y) where Y is a vector of match scores (0–1) for each specialty.
    Each sample is generated from a specialty's profile with controlled noise.
    """
    X, Y = [], []

    for _ in range(n_per_specialty):
        for target_spec_id in SPECIALTY_IDS:
            # For the target specialty: generate a well-matching profile (high score)
            features = generate_training_sample(target_spec_id, label_score=1.0, noise=0.3)

            # Compute label vector: target gets high score, others get lower
            label_row = []
            for spec_id in SPECIALTY_IDS:
                if spec_id == target_spec_id:
                    # High match with slight noise: 0.75–1.0
                    label_row.append(round(random.uniform(0.75, 1.0), 3))
                else:
                    # Low match with noise: 0.0–0.45
                    label_row.append(round(random.uniform(0.0, 0.45), 3))

            X.append(features)
            Y.append(label_row)

    return np.array(X, dtype=np.float32), np.array(Y, dtype=np.float32)


# ─── FEATURE ENGINEERING ─────────────────────────────────────────────────────

def build_feature_vector(
    bac_series: str,
    bac_grade: float,
    interests: List[str],
    strengths: Dict[str, float],
    work_env: str,
    priorities: List[str],
) -> np.ndarray:
    """Convert user input to the same feature vector used in training."""

    # Bac series — one-hot
    series_vec = [1 if s == bac_series else 0 for s in ALL_BAC_SERIES]

    # Grade normalized
    grade_norm = np.clip(bac_grade / 20.0, 0, 1)

    # Interests — multi-hot
    interest_vec = [1 if i in interests else 0 for i in ALL_INTERESTS]

    # Strengths — 1-5 normalized
    strength_vec = [strengths.get(sk, 3) / 5.0 for sk in ALL_STRENGTH_KEYS]

    # Work env — one-hot
    work_env_vec = [1 if w == work_env else 0 for w in ALL_WORK_ENVS]

    # Top priority — ordinal
    top_priority = priorities[0] if priorities else ALL_PRIORITIES[0]
    priority_idx = ALL_PRIORITIES.index(top_priority) if top_priority in ALL_PRIORITIES else 0
    priority_norm = priority_idx / 5.0

    feature_vector = (
        series_vec
        + [grade_norm]
        + interest_vec
        + strength_vec
        + work_env_vec
        + [priority_norm]
    )
    return np.array(feature_vector, dtype=np.float32).reshape(1, -1)


# ─── REASON GENERATOR ─────────────────────────────────────────────────────────

def generate_reasons(
    spec: dict,
    bac_series: str,
    bac_grade: float,
    interests: List[str],
    strengths: Dict[str, float],
    work_env: str,
    priorities: List[str],
) -> List[str]:
    """Generate human-readable reasons explaining the match."""
    reasons = []

    # Grade eligibility
    if bac_grade >= spec["minGrade"]:
        reasons.append("يتناسب مع معدلك الأكاديمي")

    # Interest overlap
    profile = SPECIALTY_PROFILES.get(spec["id"], {})
    common_interests = [i for i in interests if i in profile.get("top_interests", [])]
    if common_interests:
        reasons.append("يتناسب مع ميولك وشغفك الشخصي")

    # Work env match
    if work_env in profile.get("work_env", []):
        reasons.append("يناسب بيئة العمل التي تفضلها")

    # Top strength match
    top_skills = profile.get("top_strengths", {})
    matched_skills = [sk for sk in top_skills if strengths.get(sk, 0) >= 3.5]
    if matched_skills:
        reasons.append("يتوافق مع قدراتك ومهاراتك الأساسية")

    # Priority match
    if priorities and priorities[0] in profile.get("top_priorities", []):
        reasons.append("يحقق أولويتك المهنية الأولى")

    # Fallback
    if not reasons:
        reasons.append("يناسب ملفك الشخصي العام")

    return reasons[:3]


# ─── MODEL TRAINING & PERSISTENCE ────────────────────────────────────────────

MODEL_PATH = "masarek_model.joblib"
SCALER_PATH = "masarek_scaler.joblib"

model: Optional[MultiOutputRegressor] = None
scaler: Optional[MinMaxScaler] = None


def train_model():
    """Train the ML model and save to disk."""
    global model, scaler
    print("🧠 Generating synthetic training data...")
    X, Y = build_training_data(n_per_specialty=150)

    print(f"📊 Training on {X.shape[0]} samples, {X.shape[1]} features → {Y.shape[1]} outputs")

    # Scale features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # Split
    X_train, X_test, Y_train, Y_test = train_test_split(X_scaled, Y, test_size=0.15, random_state=42)

    # Model: MultiOutput Gradient Boosting (one regressor per specialty)
    base = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        random_state=42,
    )
    model = MultiOutputRegressor(base, n_jobs=-1)
    model.fit(X_train, (Y_train > 0.6).astype(int))  # binarize for classification

    # Evaluate
    Y_pred = model.predict(X_test)
    mae = mean_absolute_error(Y_test, Y_pred)
    print(f"✅ Model trained. MAE on test set: {mae:.4f}")

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print("💾 Model saved to disk.")


def load_or_train():
    """Load existing model or train a new one."""
    global model, scaler
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        print("📂 Loading existing model from disk...")
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("✅ Model loaded.")
    else:
        train_model()


# ─── RULE-BASED FALLBACK SCORER ───────────────────────────────────────────────

def rule_based_score(
    spec: dict,
    bac_series: str,
    bac_grade: float,
    interests: List[str],
    strengths: Dict[str, float],
    work_env: str,
    priorities: List[str],
) -> float:
    """Deterministic fallback scorer — mirrors TypeScript version."""
    profile = SPECIALTY_PROFILES.get(spec["id"], {})
    score = 0.0

    # Grade (0–25)
    if bac_grade >= spec["minGrade"]:
        score += min(25, (bac_grade - spec["minGrade"]) * 4 + 12)
    else:
        score -= 15

    # Series (0–25)
    if bac_series in profile.get("series", []):
        score += 25

    # Interests (0–25)
    common = [i for i in interests if i in profile.get("top_interests", [])]
    score += (len(common) / max(len(profile.get("top_interests", [1])), 1)) * 25

    # Strengths (0–15)
    top_sk = profile.get("top_strengths", {})
    if top_sk:
        avg = sum(strengths.get(sk, 3) for sk in top_sk) / len(top_sk)
        score += (avg / 5.0) * 15

    # Work env (0–10)
    if work_env in profile.get("work_env", []):
        score += 10

    # Priority (0–5)
    if priorities and priorities[0] in profile.get("top_priorities", []):
        score += 5

    return max(0, min(100, score))


# ─── API SCHEMA ───────────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    bac_series: str
    bac_grade: float
    interests: List[str]
    strengths: Dict[str, float]
    work_env: str
    priorities: List[str]
    wilaya: Optional[str] = None


class RecommendationItem(BaseModel):
    specialty_id: str
    nameAr: str
    nameFr: str
    fieldAr: str
    domain: str
    match_score: float
    rank: int
    reasons: List[str]
    durationYears: int
    minGrade: float
    careerPaths: List[str]
    descriptionAr: str


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    load_or_train()


@app.get("/")
def root():
    return {"status": "ok", "service": "Masarek AI Service v1.0", "model": "GradientBoosting + Rule-Based Ensemble"}


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}


@app.post("/recommend", response_model=List[RecommendationItem])
def recommend(req: RecommendRequest):
    if req.bac_grade < 0 or req.bac_grade > 20:
        raise HTTPException(status_code=422, detail="bac_grade must be between 0 and 20")

    results = []

    # ── ML prediction ──────────────────────────────────────────────────────
    use_ml = model is not None and scaler is not None
    ml_scores: Dict[str, float] = {}

    if use_ml:
        try:
            fv = build_feature_vector(
                req.bac_series,
                req.bac_grade,
                req.interests,
                req.strengths,
                req.work_env,
                req.priorities,
            )
            fv_scaled = scaler.transform(fv)
            raw_preds = model.predict(fv_scaled)[0]  # shape: (n_specialties,)
            for i, spec_id in enumerate(SPECIALTY_IDS):
                ml_scores[spec_id] = float(np.clip(raw_preds[i], 0, 1))
        except Exception as e:
            print(f"⚠️ ML prediction failed, using rule-based fallback: {e}")
            use_ml = False

    # ── Compute final scores (ensemble: ML 60% + rule-based 40%) ──────────
    for spec in SPECIALTIES:
        rule_score = rule_based_score(
            spec,
            req.bac_series,
            req.bac_grade,
            req.interests,
            req.strengths,
            req.work_env,
            req.priorities,
        )

        if use_ml and spec["id"] in ml_scores:
            # ML gives a probability 0–1; scale it to 0–100
            ml_score_100 = ml_scores[spec["id"]] * 100
            # Ensemble: 60% ML + 40% rule-based
            final_score = round(0.60 * ml_score_100 + 0.40 * rule_score, 1)
        else:
            final_score = round(rule_score, 1)

        # Hard penalty: if grade below minimum, cap at 35
        if req.bac_grade < spec["minGrade"]:
            final_score = min(final_score, 35.0)

        reasons = generate_reasons(
            spec,
            req.bac_series,
            req.bac_grade,
            req.interests,
            req.strengths,
            req.work_env,
            req.priorities,
        )

        results.append({
            "spec": spec,
            "score": final_score,
            "reasons": reasons,
        })

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    top5 = results[:5]

    return [
        RecommendationItem(
            specialty_id=r["spec"]["id"],
            nameAr=r["spec"]["nameAr"],
            nameFr=r["spec"]["nameFr"],
            fieldAr=r["spec"]["fieldAr"],
            domain=r["spec"]["domain"],
            match_score=r["score"],
            rank=i + 1,
            reasons=r["reasons"],
            durationYears=r["spec"]["durationYears"],
            minGrade=r["spec"]["minGrade"],
            careerPaths=r["spec"]["careerPaths"],
            descriptionAr=r["spec"]["descriptionAr"],
        )
        for i, r in enumerate(top5)
    ]


@app.post("/retrain")
def retrain():
    """Endpoint to retrain the model on demand."""
    train_model()
    return {"status": "retrained", "specialties": len(SPECIALTY_IDS)}