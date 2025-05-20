
# eDok Technical Development Documentation

Welcome to the developer documentation for **eDok**, an AI-driven health platform integrating both conventional and alternative medicine services. This document outlines the functionality, system design, and AI integration strategies for each of the five core features.

---

## 1. Consultation Booking (Difficulty: 1)

### Functional Overview
Enable users to book consultations with healthcare professionals via a streamlined, intelligent interface.

### Core Components
- User Authentication (Patients & Doctors)
- Dynamic Availability Management
- Calendar & Reminder System
- AI Slot Optimization
- Conversational Booking Interface

### Data Flow
1. User logs in.
2. Views list of available specialists.
3. AI suggests best time based on user and doctor schedules.
4. User confirms slot.
5. Reminders are triggered via email/SMS.

### AI Integration
- Predict low-traffic slots based on usage data.
- NLP-based chatbot to guide users through booking.

### Edge Cases
- Double bookings.
- Last-minute cancellations.
- No-show detection and reallocation.

---

## 2. E-Pharmacy (Difficulty: 2)

### Functional Overview
Provide a digital pharmacy with AI-powered recommendations, order tracking, and prescription validation.

### Core Components
- Inventory Management
- Prescription Upload & Parsing
- Drug Interaction Checker
- Order Placement & Tracking
- Recommender System

### Data Flow
1. User uploads prescription or selects medication.
2. AI validates prescription and checks interactions.
3. User confirms and places order.
4. System updates stock and sends delivery notifications.

### AI Integration
- OCR + NLP for parsing prescriptions.
- Knowledge graph for drug interactions.
- AI recommender for generics based on cost and availability.

### Edge Cases
- Fake or unclear prescriptions.
- Potentially harmful drug combinations.
- Real-time stock updates and out-of-stock handling.

---

## 3. Dietetics (Difficulty: 3)

### Functional Overview
Provide users with customized diet plans based on their health conditions and goals.

### Core Components
- Health Profile & Goal Intake
- Condition-specific Meal Planner
- Allergen & Culture Filters
- Weekly Plan Generator

### Data Flow
1. User submits health goals and dietary needs.
2. AI generates personalized plan.
3. Weekly plan sent via app notifications or email.
4. User provides feedback or logs progress.

### AI Integration
- Generative AI and rules-based planning.
- Condition-sensitive logic (e.g., diabetes, hypertension).
- Explainable AI for transparency in food choices.

### Edge Cases
- Conflicting medical requirements.
- Missing input data.
- Personal food restrictions or aversions.

---

## 4. Psychology & Mental Health (Difficulty: 4)

### Functional Overview
Support mental well-being through AI-assisted assessments, journaling, and therapy booking.

### Core Components
- Mood Tracker & Emotion Logging
- Mental Health Assessments
- Therapist Finder and Booking System
- Emergency Alert Mechanism

### Data Flow
1. User checks in via mood log or journaling.
2. AI analyzes emotional state over time.
3. Suggestions provided (coping strategies or professional help).
4. Optional therapist booking.

### AI Integration
- Sentiment analysis and trend detection.
- PHQ-9 / GAD-7 form interpretation.
- Therapist-matching algorithm based on user traits.

### Edge Cases
- Crisis detection and emergency protocol.
- Privacy and data sensitivity.
- Cultural appropriateness of language and feedback.

---

## 5. Herbal Medicine (Difficulty: 5)

### Functional Overview
Offer trustworthy herbal treatment recommendations and education backed by ethnobotanical knowledge.

### Core Components
- Herb Database with Search & Metadata
- Symptom-to-Herb Recommendation Engine
- Herb-Drug Interaction Checker
- Dosage Guidance & Warnings

### Data Flow
1. User enters symptoms or selects a condition.
2. AI suggests relevant herbs.
3. System checks for drug conflicts.
4. Returns usage guide and warnings.

### AI Integration
- NLP on ethnobotanical texts for recommendation engine.
- Knowledge graph linking herbs, compounds, effects.
- Explainable AI layer for transparency in recommendations.

### Edge Cases
- Ambiguity in herb names.
- Misinformation or folk remedies without evidence.
- Adverse interactions with pharmaceuticals.

---

## Final Notes for Development
- Prioritize user trust: include disclaimers where AI is advisory, not diagnostic.
- Ensure data privacy for sensitive areas (mental health, prescriptions).
- Leverage explainable AI where user understanding is crucial.
- Each feature can be modularized into microservices for scalable development.

