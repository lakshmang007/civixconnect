# Community Pulse & Election Assistant Workflow

This diagram outlines the core architectural and user flows of the application.

```mermaid
graph TD
    subgraph "Entry & Authentication"
        A[User Access] -->|Google Auth| B{Authenticated?}
        B -->|Yes| C[Full Profile Access]
        B -->|No| D[Guest Support Mode]
    end

    subgraph "Core Engagement Loop"
        C & D --> E[Issue Feed & Discovery]
        E --> F[Create New Issue]
        F -->|Triggers| G[In-App Notification]
        F -->|API Call| H[Email Alert to Authority]
        
        E --> I[Vote/Support Issue]
        I --> J{Support > Threshold?}
        J -->|Yes| K[Auto-Escalation Alert]
        K -->|API Call| L[Strategic Authority Email]
    end

    subgraph "Smart Election Assistant"
        M[Open AI Bot] --> N[ID Verification Flow]
        N -->|Success| O[Polling Station Assignment]
        O --> P[Google Maps Navigation]
        N -->|Triggers| Q[Monitor Activity Email]
    end

    subgraph "Backend Services"
        H & L & Q --> R[Express API Server]
        R --> S[Nodemailer/Console Log Transport]
        C & F & I --> T[(Firebase Firestore)]
    end

    style G fill:#f9f,stroke:#333,stroke-width:2px
    style O fill:#bbf,stroke:#333,stroke-width:2px
    style K fill:#faa,stroke:#333,stroke-width:4px
```

## Key Processes

1.  **Identity Verification**: The bot uses a mock LLM service to simulate voter roll verification.
2.  **Citizen Escalation**: Once an issue gains enough community support, the system switches from "Community Discussion" to "Official Escalation," triggering direct alerts to pre-defined authority emails.
3.  **Real-time Notifications**: Custom UI toasts track outbound "System Traffic" (emails) to provide transparency on when authorities are being reached.
4.  **Navigation Integration**: The system calculates the best route from the user's current location to their assigned polling station using Google Maps Directions API.
