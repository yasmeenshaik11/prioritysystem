"""
AI-Based Complaint Priority Engine
Combines NLP (TF-IDF + Scikit-Learn Classifier), domain safety lexicons,
and public urgency scoring to predict category, severity, priority score (1-100),
and department routing with full explainability.
"""
from pathlib import Path
import re
import numpy as np
from PIL import Image
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics.pairwise import cosine_similarity

# Canonical Categories as requested
CATEGORIES = [
    'Potholes',
    'Garbage',
    'Water Leakage',
    'Drainage',
    'Streetlights',
    'Accidents',
    'Fallen Trees',
    'Others'
]

# Canonical Severities as requested
SEVERITIES = ['Critical', 'High', 'Medium', 'Low']

CATEGORY_ALIASES = {
    'pothole': 'Potholes',
    'potholes': 'Potholes',
    'road hole': 'Potholes',
    'road damage': 'Potholes',
    'crater': 'Potholes',
    'garbage': 'Garbage',
    'trash': 'Garbage',
    'waste': 'Garbage',
    'litter': 'Garbage',
    'dump': 'Garbage',
    'water leak': 'Water Leakage',
    'water leakage': 'Water Leakage',
    'pipe burst': 'Water Leakage',
    'burst pipe': 'Water Leakage',
    'pipeline': 'Water Leakage',
    'drain': 'Drainage',
    'drainage': 'Drainage',
    'sewer': 'Drainage',
    'sewage': 'Drainage',
    'waterlogging': 'Drainage',
    'overflowing drain': 'Drainage',
    'broken streetlight': 'Streetlights',
    'streetlight': 'Streetlights',
    'streetlights': 'Streetlights',
    'street light': 'Streetlights',
    'lamp post': 'Streetlights',
    'accident': 'Accidents',
    'accidents': 'Accidents',
    'crash': 'Accidents',
    'collision': 'Accidents',
    'fallen tree': 'Fallen Trees',
    'fallen trees': 'Fallen Trees',
    'tree fallen': 'Fallen Trees',
    'tree branch': 'Fallen Trees',
    'other': 'Others',
    'others': 'Others',
    'fire': 'Accidents'  # mapped to emergency / accidents for response
}

DEPARTMENT_MAP = {
    'Potholes': 'Roads & Infrastructure',
    'Garbage': 'Sanitation & Waste Management',
    'Water Leakage': 'Water Supply & Sewerage',
    'Drainage': 'Municipal Engineering & Drainage',
    'Streetlights': 'Electrical & Lighting Services',
    'Accidents': 'Emergency Response & Traffic',
    'Fallen Trees': 'Disaster Management & Forestry',
    'Others': 'General Civic Administration'
}

# Domain Keyword Lexicons
CRITICAL_KEYWORDS = [
    'fire', 'flame', 'smoke', 'explosion', 'cylinder burst', 'collapse', 'collapsed',
    'trapped', 'electrocution', 'electric shock', 'live wire', 'sparking', 'exposed cable',
    'ambulance', 'casualty', 'casualties', 'bleeding', 'unconscious', 'fatal', 'fatality',
    'dead', 'death', 'life threatening', 'severe injury', 'toxic gas', 'suffocating'
]

HIGH_KEYWORDS = [
    'danger', 'dangerous', 'hazard', 'hazardous', 'accident', 'crash', 'collision',
    'deep crater', 'bike skid', 'overturned', 'flooded', 'submerged', 'sewage overflow',
    'contaminated', 'school', 'children', 'playground', 'hospital', 'elderly', 'patient',
    'highway', 'flyover', 'expressway', 'blocked road', 'traffic jam', 'complete darkness',
    'pitch dark', 'major burst', 'massive leak', 'pole leaning', 'snapped wire'
]

MEDIUM_KEYWORDS = [
    'garbage dump', 'waste', 'trash', 'stinking', 'foul smell', 'odor', 'stray dogs',
    'pothole', 'uneven road', 'pipeline leak', 'water wastage', 'drain blocked',
    'gutter overflow', 'streetlight out', 'dark street', 'flickering lamp', 'broken branch'
]

LOW_KEYWORDS = [
    'minor', 'small', 'cosmetic', 'routine', 'cleaning', 'faded paint', 'litter',
    'slow drainage', 'mild leak', 'non-urgent', 'low traffic', 'isolated'
]

def normalize_text(text):
    return re.sub(r'\s+', ' ', (text or '').lower()).strip()

def canonical_category(cat_str):
    if not cat_str:
        return 'Others'
    s = cat_str.strip().lower()
    return CATEGORY_ALIASES.get(s, cat_str if cat_str in CATEGORIES else 'Others')

# Pre-train Scikit-learn Classifier
TRAINING_SAMPLES = [
    # Potholes
    ("Deep pothole in middle of road causing vehicles and bikes to lose control", "Potholes"),
    ("Large crater on highway lane causing sudden braking and near collisions", "Potholes"),
    ("Multiple asphalt holes near school gate making road dangerous for students", "Potholes"),
    ("Road surface completely damaged and broken uneven pavement with sharp gravel", "Potholes"),
    ("Huge pothole filled with rain water hiding depth, two-wheeler skidded", "Potholes"),
    ("Damaged tar road with sinkhole forming near bus stop", "Potholes"),

    # Garbage
    ("Garbage dumped on street corner not picked up for four days stinking heavily", "Garbage"),
    ("Overflowing trash bin attracting stray dogs and cattle causing health hazard", "Garbage"),
    ("Plastic waste and commercial trash dumped openly beside residential apartments", "Garbage"),
    ("Rotting solid waste heaps blocking pedestrian footpath and breeding mosquitoes", "Garbage"),
    ("Litter and uncollected waste creating unbearable foul odor in the neighborhood", "Garbage"),

    # Water Leakage
    ("Underground drinking water supply pipe burst flooding road and wasting water", "Water Leakage"),
    ("High pressure main water line leaking continuously for past 48 hours", "Water Leakage"),
    ("Severe water pipe leakage submerging footpath and reducing domestic water pressure", "Water Leakage"),
    ("Clean water pipeline cracked and spurting water onto road near apartment", "Water Leakage"),

    # Drainage
    ("Open drainage manhole overflowing with raw sewage water into residential colony", "Drainage"),
    ("Sewage blockage causing filthy wastewater to flood street and enter ground floors", "Drainage"),
    ("Clogged stormwater drain leading to waterlogging after light shower", "Drainage"),
    ("Foul smelling drainage backflow coming onto main market road", "Drainage"),
    ("Open manhole without cover posing fatal fall risk for pedestrians in dark", "Drainage"),

    # Streetlights
    ("Streetlight pole light is not functioning, whole street pitch black at night", "Streetlights"),
    ("Multiple streetlights broken near park, safety concern for women and elderly", "Streetlights"),
    ("Street lamp post flickering continuously and wire exposed from bottom junction", "Streetlights"),
    ("Dark street without functioning lights causing safety hazard and fear of crime", "Streetlights"),
    ("Electric pole damaged with lights off and sparking connection", "Streetlights"),

    # Accidents
    ("Major head-on collision between car and truck with injured victims, ambulance needed", "Accidents"),
    ("Two wheeler accident on flyover, rider severely injured and bleeding on road", "Accidents"),
    ("Overturned commercial bus blocking traffic with passengers trapped inside", "Accidents"),
    ("Pedestrian hit by speeding vehicle, urgent medical emergency response required", "Accidents"),
    ("Road accident near highway intersection with fire spark and injured people", "Accidents"),

    # Fallen Trees
    ("Heavy storm caused large tree to fall across main road blocking entire traffic", "Fallen Trees"),
    ("Massive banyan tree uprooted and fell on electric cables and parked cars", "Fallen Trees"),
    ("Broken heavy tree branch dangling precariously over school walkway", "Fallen Trees"),
    ("Fallen tree blocking emergency access route to hospital", "Fallen Trees"),

    # Others
    ("Illegal commercial hoarding billboard vibrating dangerously in heavy wind", "Others"),
    ("Public park bench and children playground swing broken by vandals", "Others"),
    ("Excessive loudspeaker noise violation late at night disturbing students", "Others"),
    ("Stray cattle menace causing inconvenience in residential sector", "Others")
]

def build_classifier():
    X = [t[0] for t in TRAINING_SAMPLES]
    y = [t[1] for t in TRAINING_SAMPLES]
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)),
        ('nb', MultinomialNB(alpha=0.1))
    ])
    pipeline.fit(X, y)
    return pipeline

# Singleton classifier instance
_CLASSIFIER = None
def get_classifier():
    global _CLASSIFIER
    if _CLASSIFIER is None:
        _CLASSIFIER = build_classifier()
    return _CLASSIFIER

def predict_nlp_category(text, user_provided=None):
    if user_provided:
        canon = canonical_category(user_provided)
        if canon != 'Others':
            return canon, 1.0

    t = normalize_text(text)
    if not t:
        return 'Others', 0.0

    clf = get_classifier()
    try:
        probs = clf.predict_proba([t])[0]
        classes = clf.classes_
        top_idx = int(np.argmax(probs))
        top_cat = classes[top_idx]
        conf = float(probs[top_idx])

        # If confidence is solid, return ML prediction
        if conf >= 0.28:
            return top_cat, conf
    except Exception:
        pass

    # Heuristic fallback based on category keywords
    cat_scores = {c: 0 for c in CATEGORIES}
    for alias, cat in CATEGORY_ALIASES.items():
        if alias in t:
            cat_scores[cat] += len(alias)
    best_cat = max(cat_scores, key=cat_scores.get)
    if cat_scores[best_cat] > 0:
        return best_cat, 0.65
    return 'Others', 0.20

def image_signal(image_name):
    if not image_name:
        return 0, None
    name = normalize_text(Path(image_name).stem.replace('_', ' '))
    for alias, cat in CATEGORY_ALIASES.items():
        if alias in name:
            return 8, cat
    return 4, None

def analyze_complaint(description, provided_category=None, image_name=None):
    text = normalize_text(description)
    predicted_cat, conf = predict_nlp_category(text, provided_category)
    
    img_bonus, img_cat = image_signal(image_name)
    if img_cat and predicted_cat == 'Others':
        predicted_cat = img_cat

    # Base category urgency score
    category_base = {
        'Accidents': 68,
        'Fallen Trees': 50,
        'Water Leakage': 45,
        'Drainage': 44,
        'Streetlights': 40,
        'Potholes': 42,
        'Garbage': 32,
        'Others': 26
    }
    score = category_base.get(predicted_cat, 30)

    # NLP Keywords Evaluation
    crit_hits = [k for k in CRITICAL_KEYWORDS if k in text]
    high_hits = [k for k in HIGH_KEYWORDS if k in text]
    low_hits = [k for k in LOW_KEYWORDS if k in text]

    score += min(35, len(crit_hits) * 15)
    score += min(24, len(high_hits) * 6)
    score -= min(15, len(low_hits) * 6)
    score += img_bonus

    # Category specific escalation
    if predicted_cat == 'Accidents':
        score += 15
    elif predicted_cat in {'Water Leakage', 'Drainage', 'Fallen Trees'} and ('road' in text or 'traffic' in text):
        score += 8

    # Final score bounded 5 to 100
    score = int(np.clip(score, 5, 100))

    # Determine Severity & Priority
    if score >= 80 or (predicted_cat == 'Accidents' and crit_hits):
        severity = 'Critical'
        priority = 'Critical'
    elif score >= 60:
        severity = 'High'
        priority = 'High'
    elif score >= 35:
        severity = 'Medium'
        priority = 'Medium'
    else:
        severity = 'Low'
        priority = 'Low'

    explanation = build_explanation(predicted_cat, severity, score, crit_hits, high_hits, conf)

    return {
        'category': predicted_cat,
        'severity': severity,
        'urgency_score': score,
        'priority': priority,
        'department': DEPARTMENT_MAP.get(predicted_cat, DEPARTMENT_MAP['Others']),
        'confidence': round(conf, 2),
        'image_category': img_cat,
        'explanation': explanation
    }

def build_explanation(category, severity, score, crit_hits, high_hits, conf):
    highlighted = crit_hits[:2] + high_hits[:2]
    keywords_str = f" Highlighted signals: {', '.join(highlighted)}." if highlighted else ""
    
    if severity == 'Critical':
        return f"CRITICAL PRIORITY ({score}/100): Immediate public hazard detected in {category}. Escalated for rapid emergency action.{keywords_str}"
    if severity == 'High':
        return f"HIGH PRIORITY ({score}/100): Significant safety risk or community disruption in {category}. Priority dispatch required.{keywords_str}"
    if severity == 'Medium':
        return f"MEDIUM PRIORITY ({score}/100): Moderate civic issue in {category}. Scheduled for standard maintenance cycle.{keywords_str}"
    return f"LOW PRIORITY ({score}/100): Routine maintenance or minor civic report in {category}. Placed in regular queue.{keywords_str}"

def find_duplicate(description, previous_complaints, threshold=0.70):
    if not previous_complaints:
        return None, 0.0
    docs = [description] + [c.description for c in previous_complaints]
    try:
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2), min_df=1)
        matrix = vectorizer.fit_transform(docs)
        scores = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
        if scores.size == 0:
            return None, 0.0
        top_idx = int(scores.argmax())
        top_score = float(scores[top_idx])
        if top_score >= threshold:
            return previous_complaints[top_idx].id, top_score
        return None, top_score
    except Exception:
        return None, 0.0
