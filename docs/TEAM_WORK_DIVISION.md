# TensorFleet: Team Work Division
## Project Distribution for 3 Students

**Document Version**: 1.0  
**Date**: December 21, 2025  
**Project**: TensorFleet - Distributed ML Training Platform

---

## 📊 Executive Summary

This document outlines a balanced distribution of work across 3 team members for the TensorFleet distributed machine learning platform. Each student is assigned specific components based on technology stack expertise and system responsibilities.

### Team Structure

| Student Name | Student ID | Primary Role | Technology Focus | Components |
|--------------|------------|--------------|------------------|------------|
| **Aditya Suryawanshi** | 25211365 | Backend Infrastructure Lead | Go, gRPC, System Design | API Gateway, Orchestrator, Worker Nodes |
| **Rahul Mirashi** | 25211365 | ML & Data Services Lead | Python, ML, Data Processing | ML Worker, Model Service, Storage Service |
| **Soham Maji** | 25204731 | Frontend & Monitoring Lead | React, Visualization, DevOps | Frontend Dashboard, Monitoring, Documentation |

---

## 👨‍💻 Student 1: Aditya Suryawanshi (25211365)
### Backend Infrastructure Lead

### 🎯 Primary Responsibilities
**Focus**: Core orchestration, job scheduling, and distributed computing infrastructure

### 📦 Assigned Components

#### 1. API Gateway Service (Go + Gin)
**Location**: `api-gateway/`  
**Lines of Code**: ~500-600 lines  
**Technology**: Go, Gin framework, gRPC client

**Responsibilities**:
- Implement RESTful API endpoints
- Handle HTTP to gRPC translation
- Request validation and error handling
- CORS and middleware configuration
- Authentication and authorization logic
- Health check endpoints
- Integration with Orchestrator service

**Key Files**:
- `main.go` - Main server implementation
- `proto/` - gRPC stubs generation
- `Dockerfile` - Container configuration
- `README.md` - Service documentation

**Tasks**:
- [ ] Design and implement REST API endpoints
- [ ] Configure gRPC client for orchestrator communication
- [ ] Implement authentication middleware
- [ ] Add rate limiting and request validation
- [ ] Write unit tests for handlers
- [ ] Document API specifications
- [ ] Create Postman/OpenAPI documentation

---

#### 2. Orchestrator Service (Go + gRPC)
**Location**: `orchestrator/`  
**Lines of Code**: ~800-1000 lines  
**Technology**: Go, gRPC server, Redis

**Responsibilities**:
- Job queue management
- Task scheduling and distribution
- Worker registration and health monitoring
- Resource allocation optimization
- Job lifecycle management (create, monitor, cancel)
- Failure detection and recovery
- Inter-service gRPC communication

**Key Files**:
- `cmd/main.go` - Service entry point
- `internal/scheduler/` - Scheduling logic
- `internal/worker_manager/` - Worker coordination
- `proto/orchestrator.proto` - Service definitions
- `config/` - Configuration management

**Tasks**:
- [ ] Implement job scheduling algorithm
- [ ] Design worker registration system
- [ ] Create task distribution logic
- [ ] Implement health check mechanisms
- [ ] Add job status tracking
- [ ] Write integration tests
- [ ] Optimize resource allocation
- [ ] Document gRPC service contracts

---

#### 3. Worker Service (Go + gRPC)
**Location**: `worker/`  
**Lines of Code**: ~400-500 lines  
**Technology**: Go, gRPC server/client

**Responsibilities**:
- Task execution coordination
- Resource monitoring (CPU, memory)
- Communication with orchestrator
- Task progress reporting
- Error handling and recovery
- Metrics collection and reporting

**Key Files**:
- `main.go` - Worker implementation
- `executor/` - Task execution engine
- `metrics/` - Performance monitoring
- `worker_grpc.pb.go` - Generated gRPC code

**Tasks**:
- [ ] Implement worker registration with orchestrator
- [ ] Create task execution framework
- [ ] Add resource monitoring
- [ ] Implement progress reporting
- [ ] Handle task failures gracefully
- [ ] Write unit tests for worker logic
- [ ] Optimize task scheduling

---

#### 4. Protocol Buffers & gRPC (Shared)
**Location**: `proto/`  
**Lines of Code**: ~200-300 lines

**Responsibilities**:
- Define service contracts
- Message type definitions
- Code generation scripts
- API versioning

**Key Files**:
- `gateway.proto`
- `orchestrator.proto`
- `worker.proto`
- `generate.sh`

**Tasks**:
- [ ] Design comprehensive gRPC schemas
- [ ] Ensure backward compatibility
- [ ] Document message structures
- [ ] Create code generation pipeline

---

### 📚 Documentation Responsibilities
- API Gateway architecture documentation
- Orchestrator design patterns
- Worker node deployment guide
- gRPC service contracts documentation
- Performance optimization guide
- Troubleshooting common issues

### 🧪 Testing Responsibilities
- Unit tests for Go services
- Integration tests for service communication
- Load testing for orchestrator
- gRPC endpoint testing
- Redis integration testing

### 🎓 Learning Outcomes
- Microservices architecture design
- gRPC communication patterns
- Distributed system coordination
- Go programming best practices
- Container orchestration fundamentals

### ⏱️ Estimated Effort
**Total**: ~120-150 hours
- API Gateway: 30-40 hours
- Orchestrator: 50-60 hours
- Worker: 25-30 hours
- Testing & Documentation: 15-20 hours

---

## 👨‍🔬 Student 2: Rahul Mirashi (25211365)
### ML & Data Services Lead

### 🎯 Primary Responsibilities
**Focus**: Machine learning execution, data management, and model registry

### 📦 Assigned Components

#### 1. ML Worker Service (Python + Flask)
**Location**: `worker-ml/`  
**Lines of Code**: ~1200-1500 lines (modular structure)  
**Technology**: Python, Flask, scikit-learn, TensorFlow, MongoDB

**Responsibilities**:
- Machine learning model training
- Dataset loading and preprocessing
- Model persistence and checkpointing
- Metrics calculation and reporting
- MongoDB integration for datasets
- Support for multiple ML algorithms

**Key Files**:
- `main.py` - Entry point
- `config.py` - Configuration management
- `model_trainer.py` - ML training logic
- `mongodb_manager.py` - Database operations
- `storage_client.py` - Storage integration
- `worker_service.py` - Service orchestration
- `sample_data.py` - Sample datasets

**Tasks**:
- [ ] Implement training algorithms (Random Forest, SVM, Neural Networks)
- [ ] Create data preprocessing pipeline
- [ ] Add model evaluation metrics
- [ ] Implement checkpoint saving/loading
- [ ] Integrate with MongoDB for datasets
- [ ] Add hyperparameter tuning support
- [ ] Write unit tests for training logic
- [ ] Optimize training performance
- [ ] Document supported algorithms

---

#### 2. Model Service (Python + Flask + MongoDB)
**Location**: `model-service/`  
**Lines of Code**: ~350-400 lines  
**Technology**: Python, Flask, MongoDB, GridFS

**Responsibilities**:
- Model registry and versioning
- Model metadata management
- Model upload/download via GridFS
- Model search and filtering
- Performance metrics tracking
- Model lifecycle management

**Key Files**:
- `main.py` - Flask API server
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration

**Tasks**:
- [ ] Implement model CRUD operations
- [ ] Design model metadata schema
- [ ] Create GridFS integration
- [ ] Add model versioning logic
- [ ] Implement search and filtering
- [ ] Create model comparison features
- [ ] Write API endpoint tests
- [ ] Document model registry API

---

#### 3. Storage Service (Python + Flask + MinIO)
**Location**: `storage/`  
**Lines of Code**: ~500-600 lines  
**Technology**: Python, Flask, MinIO (S3-compatible)

**Responsibilities**:
- Object storage management
- Dataset upload/download
- File organization (buckets)
- Storage analytics
- MinIO integration
- MongoDB metadata tracking

**Key Files**:
- `main.py` - Flask API server
- `storage_manager.py` - MinIO wrapper
- `requirements.txt` - Python dependencies

**Tasks**:
- [ ] Implement file upload/download endpoints
- [ ] Create bucket management logic
- [ ] Add storage analytics
- [ ] Implement file versioning
- [ ] Add metadata tracking in MongoDB
- [ ] Create cleanup and retention policies
- [ ] Write integration tests
- [ ] Document storage API

---

#### 4. MongoDB & Data Management (Shared)
**Location**: Multiple services  
**Technology**: MongoDB Atlas, GridFS, PyMongo

**Responsibilities**:
- Database schema design
- Collection management
- GridFS file storage
- Query optimization
- Data migration scripts
- Backup and recovery

**Tasks**:
- [ ] Design database schema
- [ ] Create indexes for performance
- [ ] Implement data validation
- [ ] Write migration scripts
- [ ] Document database structure

---

### 📚 Documentation Responsibilities
- ML algorithms supported
- Model training workflow
- Dataset format specifications
- Storage API documentation
- MongoDB schema documentation
- Data pipeline architecture

### 🧪 Testing Responsibilities
- Unit tests for ML training logic
- Model training end-to-end tests
- Storage service integration tests
- MongoDB connection testing
- Performance benchmarking for training

### 🎓 Learning Outcomes
- Machine learning model training
- Data engineering best practices
- MongoDB and GridFS usage
- Python microservices development
- ML model lifecycle management

### ⏱️ Estimated Effort
**Total**: ~120-150 hours
- ML Worker: 60-70 hours
- Model Service: 25-30 hours
- Storage Service: 25-30 hours
- Testing & Documentation: 10-20 hours

---

## 👨‍💻 Student 3: Soham Maji (25204731)
### Frontend & Monitoring Lead

### 🎯 Primary Responsibilities
**Focus**: User interface, visualization, monitoring, and observability

### 📦 Assigned Components

#### 1. Frontend Dashboard (React + Vite + Material-UI)
**Location**: `frontend/`  
**Lines of Code**: ~2000-2500 lines (JSX + CSS)  
**Technology**: React 18, Vite, Material-UI v5, Axios

**Responsibilities**:
- User interface design and implementation
- Job submission forms
- Real-time monitoring dashboards
- Worker visualization
- Model registry interface
- Dataset management UI
- Storage overview panels

**Key Files**:
- `src/App.jsx` - Main application
- `src/components/` - React components
  - `DashboardMetrics.jsx`
  - `JobSubmissionForm.jsx`
  - `JobDetailsPanel.jsx`
  - `WorkerVisualization.jsx`
  - `ModelRegistryPanel.jsx`
  - `DatasetManagerPanel.jsx`
  - `StorageOverviewPanel.jsx`
- `src/api/api.js` - API client
- `src/theme.js` - Material-UI theme

**Tasks**:
- [ ] Design responsive UI layout
- [ ] Implement job submission workflow
- [ ] Create real-time monitoring charts
- [ ] Build worker status visualization
- [ ] Develop model registry interface
- [ ] Add dataset upload/management UI
- [ ] Implement error handling and notifications
- [ ] Add dark mode support
- [ ] Write component tests
- [ ] Optimize performance and bundle size
- [ ] Document UI components

---

#### 2. Monitoring Service (Python + Flask)
**Location**: `monitoring/`  
**Lines of Code**: ~200-250 lines  
**Technology**: Python, Flask, Prometheus client

**Responsibilities**:
- Metrics collection and aggregation
- Health check coordination
- Auto-scaling triggers
- System performance monitoring
- API for monitoring data
- Integration with Prometheus

**Key Files**:
- `main.py` - Flask API server
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration

**Tasks**:
- [ ] Implement metrics collection endpoints
- [ ] Create health check aggregation
- [ ] Add auto-scaling logic
- [ ] Implement alerting thresholds
- [ ] Create monitoring API endpoints
- [ ] Write integration tests
- [ ] Document monitoring architecture

---

#### 3. Infrastructure & Observability
**Technology**: Prometheus, Grafana, Docker, Kubernetes

**Responsibilities**:
- Prometheus configuration
- Grafana dashboard creation
- Docker Compose orchestration
- Kubernetes manifest management
- CI/CD pipeline setup
- Deployment automation

**Key Files**:
- `docker-compose.yml`
- `k8s/*.yaml` - Kubernetes manifests
- `k8s/deploy.sh` - Deployment script
- `k8s/build-images.sh` - Image building
- Grafana dashboards
- Prometheus configuration

**Tasks**:
- [ ] Configure Prometheus scraping
- [ ] Create Grafana dashboards
- [ ] Optimize Docker Compose setup
- [ ] Enhance Kubernetes manifests
- [ ] Create deployment documentation
- [ ] Add health check monitoring
- [ ] Implement logging aggregation

---

#### 4. Documentation & Project Management
**Location**: `docs/`, `README.md`, etc.

**Responsibilities**:
- Comprehensive documentation
- Architecture diagrams
- API reference documentation
- Installation guides
- Troubleshooting guides
- Demo scripts
- Project reports

**Key Files**:
- `README.md` - Main documentation
- `docs/PROJECT_REPORT.md` - Project report
- `docs/ARCHITECTURE.md` - Architecture guide
- `docs/API_REFERENCE.md` - API documentation
- `docs/INSTALLATION.md` - Setup guide
- `docs/DEMO_SCRIPT.md` - Demo guide
- `CONTRIBUTING.md` - Contribution guide

**Tasks**:
- [ ] Write comprehensive README
- [ ] Create architecture diagrams
- [ ] Document all API endpoints
- [ ] Write installation guides
- [ ] Create troubleshooting guide
- [ ] Develop demo scripts
- [ ] Maintain project report
- [ ] Create video demo materials

---

### 📚 Documentation Responsibilities
- Frontend architecture documentation
- UI/UX design guidelines
- Monitoring setup guide
- Kubernetes deployment guide
- Docker Compose usage
- Overall project documentation
- Demo and presentation materials

### 🧪 Testing Responsibilities
- Frontend component tests
- UI/UX integration tests
- Monitoring service tests
- End-to-end workflow tests
- Deployment validation tests

### 🎓 Learning Outcomes
- Modern React development
- Material-UI component library
- Real-time data visualization
- Monitoring and observability
- Container orchestration
- Technical documentation writing

### ⏱️ Estimated Effort
**Total**: ~120-150 hours
- Frontend Dashboard: 70-80 hours
- Monitoring Service: 20-25 hours
- Infrastructure & DevOps: 20-25 hours
- Documentation: 10-20 hours

---

## 🤝 Shared Responsibilities

### All Team Members

#### 1. Integration Testing
- End-to-end workflow testing
- Cross-service communication validation
- Performance testing
- Load testing

#### 2. Code Reviews
- Review each other's code
- Provide constructive feedback
- Ensure code quality standards

#### 3. Bug Fixes
- Triage and prioritize bugs
- Collaborative debugging
- Root cause analysis

#### 4. Deployment
- Coordinate deployments
- Environment setup
- Production readiness

#### 5. Team Meetings
- Weekly sync meetings
- Sprint planning
- Retrospectives
- Demo preparations

---

## 📅 Project Timeline

### Week 1-2: Setup & Foundation
- **Aditya Suryawanshi**: API Gateway skeleton, gRPC setup
- **Rahul Mirashi**: ML Worker environment, MongoDB setup
- **Soham Maji**: Frontend scaffolding, Material-UI setup

### Week 3-4: Core Implementation
- **Aditya Suryawanshi**: Orchestrator implementation, worker registration
- **Rahul Mirashi**: ML training algorithms, model service
- **Soham Maji**: Dashboard components, job submission UI

### Week 5-6: Integration
- **Aditya Suryawanshi**: Service-to-service communication, error handling
- **Rahul Mirashi**: Storage integration, data pipelines
- **Soham Maji**: Real-time monitoring, worker visualization

### Week 7-8: Testing & Polish
- **Aditya Suryawanshi**: Integration tests, performance optimization
- **Rahul Mirashi**: ML algorithm testing, data validation
- **Soham Maji**: UI/UX refinement, documentation

### Week 9-10: Deployment & Demo
- **All Team Members**: Final integration, Kubernetes deployment, demo preparation

---

## 📊 Work Distribution Summary

| Aspect | Aditya Suryawanshi (25211365) | Rahul Mirashi (25211365) | Soham Maji (25204731) |
|--------|-------------------------------|--------------------------|----------------------|
| **Primary Language** | Go | Python | JavaScript/React |
| **Lines of Code** | ~1500-2000 | ~2000-2500 | ~2200-2800 |
| **Services** | 3 services | 3 services | 2 services + docs |
| **Focus Area** | Backend | ML & Data | Frontend & Ops |
| **Estimated Hours** | 120-150 | 120-150 | 120-150 |
| **Complexity** | High | High | Medium-High |

---

## 🎯 Success Metrics

### Aditya Suryawanshi - Backend Infrastructure Lead
- ✅ All services respond to health checks
- ✅ Jobs can be submitted via API Gateway
- ✅ Orchestrator successfully distributes tasks
- ✅ Workers register and report status
- ✅ 90%+ test coverage for Go services

### Rahul Mirashi - ML & Data Services Lead
- ✅ ML models train successfully
- ✅ Model registry stores and retrieves models
- ✅ Storage service handles file operations
- ✅ MongoDB integration works seamlessly
- ✅ 85%+ test coverage for Python services

### Soham Maji - Frontend & Monitoring Lead
- ✅ Dashboard displays real-time data
- ✅ All UI components are responsive
- ✅ Monitoring shows accurate metrics
- ✅ Complete documentation available
- ✅ Successful Kubernetes deployment

---

## 🔄 Communication Protocols

### Daily Standups (15 minutes)
- What did I accomplish yesterday?
- What will I work on today?
- Any blockers or dependencies?

### Weekly Sprint Reviews (1 hour)
- Demo completed features
- Discuss challenges faced
- Plan next week's priorities

### Code Review Process
- Create pull requests for all changes
- At least one approval required
- Run automated tests before merge
- Document significant changes

### Issue Tracking
- Use GitHub Issues for task management
- Label by service, priority, type
- Assign issues to team members
- Update status regularly

---

## 🛠️ Development Environment Setup

### Prerequisites (All Students)
```bash
# Required software
- Docker & Docker Compose
- Git
- VS Code or preferred IDE

# Student 1 specific
- Go 1.20+
- protoc (Protocol Buffers compiler)
- Redis client

# Student 2 specific
- Python 3.10+
- pip and virtualenv
- MongoDB Compass (optional)

# Student 3 specific
- Node.js 18+
- npm or yarn
```

### Repository Setup
```bash
# Clone repository
git clone https://github.com/aditya2907/TensorFleet.git
cd TensorFleet

# Create feature branch
git checkout -b feature/your-feature-name

# Start services
docker-compose -f docker-compose.development.yml up -d
```

---

## 📝 Best Practices

### Code Style
- **Go**: Follow standard Go conventions, use `gofmt`
- **Python**: PEP 8, Black formatter, type hints
- **JavaScript**: ESLint, Prettier, React best practices

### Git Workflow
- Feature branches for all work
- Meaningful commit messages
- Rebase before merging
- Keep commits atomic and focused

### Documentation
- Comment complex logic
- Update README when adding features
- Document API endpoints
- Keep architecture diagrams current

### Testing
- Write tests for new features
- Maintain high test coverage
- Test edge cases and error paths
- Run tests before pushing

---

## 🆘 Support & Resources

### Internal Resources
- Project Wiki: [Internal documentation]
- Slack Channel: #tensorfleet-dev
- Weekly Office Hours: Fridays 2-4 PM

### External Resources
- **Go**: https://go.dev/doc/
- **gRPC**: https://grpc.io/docs/
- **React**: https://react.dev/
- **Material-UI**: https://mui.com/
- **Python Flask**: https://flask.palletsprojects.com/
- **MongoDB**: https://docs.mongodb.com/
- **Kubernetes**: https://kubernetes.io/docs/

### Getting Help
1. Check documentation first
2. Search existing issues
3. Ask in team chat
4. Schedule 1-on-1 with team member
5. Escalate to project lead if needed

---

## ✅ Conclusion

This work division ensures:
- **Balanced workload** across all team members
- **Clear ownership** of components
- **Minimal dependencies** between students
- **Skill development** in different areas
- **Collaborative opportunities** for integration

Each student has approximately **120-150 hours** of work, which can be completed over a **10-week period** with **12-15 hours/week** commitment.

**Success depends on**:
- Regular communication
- Meeting deadlines
- Code quality standards
- Collaborative problem-solving
- Comprehensive testing

---

**Document Version**: 1.0  
**Last Updated**: December 21, 2025  
**Authors**: 
- Aditya Suryawanshi (25211365)
- Rahul Mirashi (25211365)
- Soham Maji (25204731)

**Status**: Active
