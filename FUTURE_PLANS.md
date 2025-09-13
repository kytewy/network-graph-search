# Network Graph Search - Future Implementation Plans

## Project Restructuring: Python Backend and React Frontend

This document outlines our plan to restructure the Network Graph Search project into a separate Python backend and React frontend architecture. The goal is to leverage Python for backend data processing and database management while maintaining a clean, interactive frontend.

## Architecture Overview

### Backend (Python)
- Database management with PostgreSQL
- Data processing and analysis
- API endpoints for the frontend
- LLM integration for node analysis
- Similarity calculations and search functionality

### Frontend (React)
- User interface components
- Network graph visualization
- State management
- User interactions and filtering

## Database Schema

```
Node
├── id (UUID, primary key)
├── label (String)
├── type (String)
├── size (Float)
├── color (String)
├── summary (Text)
├── content (Text)
├── continent (String)
├── country (String)
├── state_province (String, nullable)
├── source_type (String)
├── url (String)
└── created_at (DateTime)

Link
├── id (UUID, primary key)
├── source_id (UUID, foreign key to Node)
├── target_id (UUID, foreign key to Node)
├── type (String)
├── strength (Float)
└── created_at (DateTime)

Analysis
├── id (UUID, primary key)
├── prompt (Text)
├── response (Text)
├── node_ids (Array of UUIDs)
├── created_at (DateTime)
└── feedback (String, nullable)
```

## File System Organization

```
network-graph-search/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI application entry point
│   │   ├── config.py              # Configuration settings
│   │   ├── database.py            # Database connection setup
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   ├── services/
│   │   └── utils/
│   ├── alembic/                   # Database migrations
│   ├── tests/                     # Backend tests
│   ├── .env                       # Environment variables
│   ├── requirements.txt           # Python dependencies
│   └── README.md                  # Backend documentation
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md                  # Frontend documentation
│
├── docker-compose.yml             # Docker setup for local development
├── .gitignore
└── README.md                      # Project overview
```

## Implementation Phases

### Phase 1: Set up Python Backend Structure (1-2 weeks)
- Set up the Python virtual environment
- Create the basic directory structure for the backend
- Install core dependencies (FastAPI, SQLAlchemy, etc.)
- Set up configuration management
- Create a simple "Hello World" API endpoint to verify setup

### Phase 2: Implement Database Models and Migrations (2-3 weeks)
- Design and implement SQLAlchemy models for Node, Link, and Analysis
- Set up Alembic for database migrations
- Create initial migration scripts
- Implement data import scripts to migrate existing data
- Set up database connection pooling and error handling

### Phase 3: Create Core API Endpoints (2-3 weeks)
- Implement CRUD operations for Nodes
- Implement CRUD operations for Links
- Create basic filtering and pagination
- Set up authentication if needed
- Document API endpoints with OpenAPI/Swagger

### Phase 4: Implement Search and Analysis Services (3-4 weeks)
- Port the existing similarity calculation logic to Python
- Implement the LLM integration for node analysis
- Create the search service with text-based and filter-based search
- Optimize query performance for large datasets
- Add caching for frequently accessed data

### Phase 5: Adapt Frontend to Use New Backend (3-4 weeks)
- Create API client services in the frontend
- Update state management to fetch from the new API
- Modify components to handle the new data format
- Implement error handling and loading states
- Ensure the graph visualization works with the new data source

### Phase 6: Testing and Optimization (2-3 weeks)
- Write unit tests for backend services
- Implement integration tests for API endpoints
- Perform load testing and optimize performance
- Fix bugs and edge cases
- Document the entire system

## Implementation Strategy

### Parallel Development
We'll work on both systems in parallel during the transition:
- Keep the current Next.js application running
- Develop the Python backend separately
- Gradually switch frontend components to use the new API

### Data Migration Strategy
- Start with a one-time export of data from the current system
- Import into the new database structure
- Eventually implement a synchronization mechanism if needed during transition

### Incremental Feature Migration
Instead of migrating everything at once, we'll:
- Start with read-only endpoints (GET requests)
- Then add write operations (POST, PUT, DELETE)
- Finally, implement the more complex analysis features

## API Endpoints

### Nodes
- `GET /api/nodes` - Get all nodes with optional filtering
- `GET /api/nodes/{node_id}` - Get a specific node
- `POST /api/nodes` - Create a new node
- `PUT /api/nodes/{node_id}` - Update a node
- `DELETE /api/nodes/{node_id}` - Delete a node

### Links
- `GET /api/links` - Get all links with optional filtering
- `GET /api/links/{link_id}` - Get a specific link
- `POST /api/links` - Create a new link
- `PUT /api/links/{link_id}` - Update a link
- `DELETE /api/links/{link_id}` - Delete a link

### Search
- `POST /api/search` - Search nodes based on text and filters
- `POST /api/search/similarity` - Calculate similarity between nodes

### Analysis
- `POST /api/analyze-nodes` - Analyze selected nodes with LLM
- `GET /api/analysis/{analysis_id}` - Get a previous analysis
- `POST /api/analysis/{analysis_id}/feedback` - Add feedback to an analysis

## Recommended Technologies

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **LLM Integration**: LangChain or direct API integration with LLama/Groq
- **Vector Operations**: NumPy, SciPy
- **Text Processing**: NLTK, spaCy
- **API Documentation**: Swagger UI (built into FastAPI)
- **Testing**: pytest

### Frontend
- **Framework**: React with TypeScript
- **State Management**: Zustand (already in use)
- **UI Components**: Continue using existing UI components
- **Graph Visualization**: D3.js or React Force Graph
- **API Client**: Axios or React Query
- **Styling**: Continue with Tailwind CSS

### Development Tools
- **Containerization**: Docker and Docker Compose
- **Version Control**: Git
- **CI/CD**: GitHub Actions
