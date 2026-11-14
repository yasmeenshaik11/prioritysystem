# Emergency AI – CSP Diagrams

All diagrams below are written in Mermaid so they can be rendered in Markdown-compatible editors and Mermaid Live.

## 1. ER Diagram

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : reports
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o| OFFICERS : has_profile
    OFFICERS ||--o{ COMPLAINTS : assigned_to
    COMPLAINTS ||--o{ COMPLAINT_STATUS_HISTORY : has
    COMPLAINTS ||--o{ NOTIFICATIONS : triggers
    COMPLAINTS }o--o| COMPLAINTS : duplicate_of
    USERS ||--o{ COMPLAINT_STATUS_HISTORY : changes
    USERS {
      bigint id PK
      varchar full_name
      varchar email UK
      varchar role
      varchar area
    }
    OFFICERS {
      bigint id PK
      bigint user_id FK
      varchar employee_code
      varchar department
    }
    COMPLAINTS {
      bigint id PK
      varchar complaint_code UK
      bigint citizen_id FK
      varchar category
      text description
      decimal latitude
      decimal longitude
      varchar ai_category
      varchar ai_severity
      int urgency_score
      varchar priority
      varchar department
      varchar status
    }
    COMPLAINT_STATUS_HISTORY {
      bigint id PK
      bigint complaint_id FK
      varchar old_status
      varchar new_status
      bigint changed_by FK
      datetime created_at
    }
    NOTIFICATIONS {
      bigint id PK
      bigint user_id FK
      bigint complaint_id FK
      varchar title
      varchar message
      boolean is_read
    }
```

## 2. System Architecture

```mermaid
flowchart LR
  C[Citizen Web / Mobile] --> R[React / Expo UI]
  O[Officer Web] --> R
  R --> API[Flask REST API + JWT]
  API --> DB[(MySQL)]
  API --> AI[AI Priority Engine]
  AI --> NLP[TF-IDF + similarity]
  AI --> IMG[Optional TensorFlow image model]
  API --> MAP[Leaflet / OpenStreetMap]
  API --> FS[(Upload Storage)]
```

## 3. Flowchart – Complaint Lifecycle

```mermaid
flowchart TD
  A[Citizen Login] --> B[Create Complaint]
  B --> C[Capture GPS / Manual Location]
  C --> D[Upload Image + Description]
  D --> E[AI Analysis]
  E --> F[Category]
  E --> G[Severity]
  E --> H[Urgency 0-100]
  E --> I[Priority]
  E --> J[Department]
  E --> K[Duplicate Check]
  F --> L[Generate Complaint ID]
  G --> L
  H --> L
  I --> L
  J --> L
  K --> L
  L --> M[Submitted]
  M --> N[Officer Priority Queue]
  N --> O[Under Review]
  O --> P[Assigned]
  P --> Q[In Progress]
  Q --> R[Resolve + Image]
  R --> S[Resolved]
  S --> T[Citizen Notification]
```

## 4. Use Case Diagram

```mermaid
flowchart LR
  citizen((Citizen))
  officer((Officer))
  citizen --- uc1[Register/Login]
  citizen --- uc2[Create Complaint]
  citizen --- uc3[Upload Image]
  citizen --- uc4[GPS / Manual Location]
  citizen --- uc5[Track Status]
  citizen --- uc6[View Notifications]
  officer --- uc7[Secure Login]
  officer --- uc8[View AI Priority Queue]
  officer --- uc9[Filter Complaints]
  officer --- uc10[View Complaint Map]
  officer --- uc11[Assign Field Staff]
  officer --- uc12[Update Status]
  officer --- uc13[Add Remarks]
  officer --- uc14[Upload Resolution Image]
  officer --- uc15[View Analytics]
  uc2 --> ai[AI Complaint Analysis]
  uc8 --> ai
```

## 5. Sequence Diagram

```mermaid
sequenceDiagram
  actor Citizen
  participant UI as React/Expo
  participant API as Flask API
  participant AI as AI Engine
  participant DB as MySQL
  participant Officer as Officer Portal

  Citizen->>UI: Submit complaint + image + GPS
  UI->>API: POST /complaints
  API->>AI: Analyze text/image
  AI-->>API: category, severity, urgency, priority, department
  API->>DB: Save complaint + history
  DB-->>API: complaint id
  API-->>UI: complaint + AI result
  Officer->>UI: Open priority queue
  UI->>API: GET /officer/complaints
  API->>DB: Query sorted by urgency
  DB-->>API: complaints
  API-->>Officer: priority queue
  Officer->>API: Assign/update status
  API->>DB: Save update + history
  API->>DB: Create notification
  API-->>Officer: Updated complaint
```

## 6. Class Diagram

```mermaid
classDiagram
  class User {
    +id
    +full_name
    +email
    +role
    +area
  }
  class Officer {
    +id
    +employee_code
    +department
    +designation
  }
  class Complaint {
    +id
    +complaint_code
    +description
    +ai_category
    +ai_severity
    +urgency_score
    +priority
    +department
    +status
  }
  class ComplaintStatusHistory {
    +id
    +old_status
    +new_status
    +remarks
  }
  class Notification {
    +id
    +title
    +message
    +is_read
  }
  class PriorityEngine {
    +analyze_complaint()
    +find_duplicate()
  }
  User "1" --> "many" Complaint : reports
  User "1" --> "0..1" Officer : profile
  Officer "1" --> "many" Complaint : assigned
  Complaint "1" --> "many" ComplaintStatusHistory : has
  User "1" --> "many" ComplaintStatusHistory : changes
  User "1" --> "many" Notification : receives
  PriorityEngine --> Complaint : analyzes
```

## 7. DFD Level 0 – Context Diagram

```mermaid
flowchart LR
  Citizen[Citizen] -->|complaint + image + location| System((Emergency AI System))
  Officer[Government Officer] -->|manage / update / assign| System
  System -->|status + notifications| Citizen
  System -->|priority queue + analytics| Officer
```

## 8. DFD Level 1

```mermaid
flowchart LR
  C[Citizen] --> P1[1.0 Authentication]
  C --> P2[2.0 Complaint Capture]
  P2 --> P3[3.0 AI Analysis]
  P3 --> D1[(Complaint DB)]
  P1 --> D2[(User DB)]
  O[Officer] --> P4[4.0 Complaint Management]
  P4 --> D1
  P4 --> D2
  P4 --> P5[5.0 Notifications]
  P5 --> D3[(Notification DB)]
  D1 --> P6[6.0 Analytics / Map]
  P6 --> O
  D1 --> P7[7.0 Citizen Tracking]
  P7 --> C
```

## 9. Project Modules

1. Authentication & Role Management
2. Citizen Complaint Management
3. AI NLP Classification
4. AI Image Classification (optional trained TensorFlow model)
5. Urgency and Priority Scoring
6. Duplicate Complaint Detection
7. Officer Queue & Assignment
8. Complaint Lifecycle / Status History
9. Maps & Geolocation
10. Notifications
11. Analytics & Reporting
12. Web + Mobile UI
