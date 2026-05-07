# Task Nexus Pro
### Enterprise-Grade Task Management and Resource Coordination System

Task Nexus Pro is a full-stack project management application designed to facilitate team collaboration through a secure, scalable architecture. The platform implements a robust Role-Based Access Control (RBAC) framework, enabling administrators to manage project lifecycles, resource allocation, and real-time progress tracking within a unified interface.

---

## Technical Infrastructure

The system utilizes a decoupled architecture to ensure high availability and maintainability.

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Frontend** | React.js | Single Page Application (SPA) built with Vite and Tailwind CSS. |
| **Backend** | FastAPI | High-performance Python REST API for asynchronous request handling. |
| **Database** | SQLite | Managed via SQLAlchemy ORM for reliable, local-file persistence. |
| **Security** | JWT & Bcrypt | Stateless authentication via JSON Web Tokens and high-entropy hashing. |
| **Deployment** | Railway | Fully containerized deployment utilizing CI/CD pipelines. |

---

## Core System Functionalities

### Role-Based Access Control (RBAC)
The application manages permissions through a strictly enforced two-tier authorization system:
* **Administrator:** Complete oversight of the project ecosystem, including the ability to initialize projects, register users, and delegate tasks.
* **Member:** Access restricted to assigned tasks, status updates, and personal progress metrics.

### Intelligent Automated Provisioning
To streamline initial setup, the backend logic evaluates the database state upon the first registration. The system automatically designates the primary user as the **ADMIN**, establishing the initial control node without requiring manual database intervention. All subsequent users default to a **MEMBER** status.

### Security and Data Integrity
* **Token-Based Auth:** Secure session management via JWT.
* **Schema Validation:** Strict request/response validation using Pydantic models.
* **Hashing Standards:** Implementation of the `bcrypt` library (v4.3.0) to ensure industry-standard password security.

---

## Deployment Configuration

The live environment is orchestrated through the Railway cloud platform, ensuring 99.9% uptime and automated SSL certificate management.

* **Production Frontend:** [https://task-nexus-pro-production.up.railway.app](https://task-nexus-pro-production.up.railway.app)
* **Production API Service:** [https://web-production-90b2d.up.railway.app](https://web-production-90b2d.up.railway.app)

---

## Installation and Local Development

### Prerequisites
* Python 3.10+
* Node.js (LTS)
* Git

### Backend Setup
1. Clone the repository and navigate to the root directory.
2. Create and activate a Python virtual environment.
3. Install dependencies:
   `pip install -r requirements.txt`
4. Launch the API server:
   `uvicorn main:app --reload`

### Frontend Setup
1. Navigate to the `/frontend` directory.
2. Install dependencies:
   `npm install`
3. Configure the `VITE_API_URL` environment variable to point to your local backend.
4. Launch the development server:
   `npm run dev`

---

## Architectural Overview
The system architecture follows a modern web application pattern where the React frontend serves as a dynamic client communicating with a stateless FastAPI backend. This design supports horizontal scalability and provides a clear separation of concerns, making the platform adaptable for various enterprise project management needs.

---

**Author:** [Pratham Kumar / Repository Owner]  
**Project Status:** Deployed / Production Ready
