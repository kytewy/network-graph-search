---
trigger: always_on
---

Ensure this structure is being followed, if you are going change ask the user for permission:

backend/
├── agents/
│ ├── **init**.py
│ ├── legal_agent.py # Main entry point and workflow definition
│ ├── models/
│ │ ├── **init**.py
│ │ └── legal_models.py # Pydantic models
│ ├── nodes/
│ │ ├── **init**.py
│ │ ├── intent_parser.py # Intent parsing logic
│ │ ├── query_generator.py # Cypher query generation
│ │ ├── database_executor.py # Database query execution
│ │ └── analysis_generator.py # Analysis generation
├── database/
│ ├── **init**.py
│ ├── client.py # Database connection handling
│ ├── base_repository.py # Base repository class
│ └── legal_repository.py # Legal-specific database operations
└── utils/
├── **init**.py
├── api_client.py # LLM API client
└── config.py # Configuration management
