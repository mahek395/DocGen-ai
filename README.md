# AI-Powered GitHub Codebase Documentation Generator

An intelligent tool that automatically generates comprehensive documentation for GitHub repositories using AI. This application analyzes your codebase, understands its architecture, and generates both README files and developer guides with detailed technical insights.

## 🌟 Features

- **Automatic Repository Analysis**: Clones and deeply analyzes GitHub repositories
- **AI-Powered Documentation Generation**: Uses OpenRouter API to generate intelligent, context-aware documentation
- **Dual Document Generation**: Creates both README and Developer Guide documents
- **PDF Export**: Download generated documentation as PDF files
- **Job Queue System**: Efficient background processing with BullMQ and Redis
- **Real-time Progress Tracking**: Monitor documentation generation progress in real-time
- **Dark/Light Mode UI**: Modern, responsive frontend with theme support
- **Tech Stack Detection**: Automatically identifies frameworks, languages, and technologies used

## 📋 Tech Stack

### Backend
- **Framework**: Express.js
- **Runtime**: Node.js
- **Database**: MySQL
- **Queue System**: BullMQ with Redis
- **API Integration**: OpenRouter (AI API)
- **Repository Handling**: simple-git
- **PDF Generation**: PDFKit

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Markdown Rendering**: react-markdown with GFM support
- **Icons**: Lucide React

## 📁 Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app configuration
│   │   ├── server.js              # Server entry point
│   │   ├── config/
│   │   │   ├── db.js              # MySQL pool configuration
│   │   │   ├── redis.js           # Redis connection
│   │   │   └── env.js             # Environment configuration
│   │   ├── constants/
│   │   │   └── jobStatus.js       # Job status constants
│   │   ├── controllers/
│   │   │   └── job.controller.js  # Job API endpoints
│   │   ├── routes/
│   │   │   └── job.routes.js      # Job routes
│   │   ├── services/
│   │   │   └── job.service.js     # Job business logic
│   │   ├── queues/
│   │   │   └── doc.queue.js       # BullMQ queue setup
│   │   ├── workers/
│   │   │   └── doc.worker.js      # Background job processor
│   │   └── utils/
│   │       ├── fileUtils.js       # File system utilities
│   │       ├── openRouterAPI.js   # AI documentation generation
│   │       ├── pdfGenerator.js    # PDF export functionality
│   │       ├── repoAnalysis.js    # Repository analysis logic
│   │       └── splitDocuments.js  # Document splitting utilities
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx                # Main application component
    │   ├── api/
    │   │   └── jobApi.js          # Job API client
    │   ├── components/
    │   │   └── MarkdownRenderer.jsx # Markdown rendering component
    │   ├── utils/
    │   │   └── downloadMarkdown.js # File download utilities
    │   ├── App.css                # Global styles
    │   ├── index.css              # Reset styles
    │   └── main.jsx               # React entry point
    ├── public/                     # Static assets
    ├── index.html                 # HTML entry point
    ├── vite.config.js             # Vite configuration
    ├── tailwind.config.js         # Tailwind CSS configuration
    ├── postcss.config.js          # PostCSS configuration
    └── package.json
```

## 🐳 Running with Docker

The entire application stack can be run with a single command using Docker Compose. This is the recommended way to run the project locally.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/mahek395/DocGen-ai.git
   cd DocGen-ai
   ```

2. Create a root `.env` file with your database credentials
   ```bash
   DB_PASSWORD=your_mysql_password
   DB_NAME=ai_doc_generator
   ```

3. Create `backend/.env` with all required variables
   ```bash
   PORT=5000
   DB_HOST=mysql
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ai_doc_generator
   REDIS_HOST=redis
   REDIS_PORT=6379
   CORS_ORIGIN=http://localhost
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. Start all services
   ```bash
   docker compose up
   ```

The app will be available at `http://localhost`.

### Services

| Service | Description | Port |
|---------|-------------|------|
| frontend | React app served via Nginx | 80 |
| backend | Express API server | 5000 |
| worker | BullMQ background job processor | - |
| mysql | Job and document storage | 3306 |
| redis | Queue backend for BullMQ | 6379 |

### Notes
- MySQL and Redis health checks ensure the backend and worker only start once the databases are ready
- The worker runs as a separate container using the same backend image, overriding the start command
- On first run, `init.sql` is automatically executed to create the required database schema
- To reset all data and reinitialize the database: `docker compose down -v && docker compose up`

## 🚀 Getting Started (Manual Setup)

### Prerequisites

- **Node.js** (v20 or higher)
- **MySQL** (v8 or higher) - for job and document storage
- **Redis** (v6 or higher) - for queue management
- **Git** - for repository cloning
- **OpenRouter API Key** - for AI documentation generation

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/mahek395/DocGen-ai.git
cd DocGen-ai
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_doc_generator

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key

# Server Port
PORT=5000

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file (optional, for custom API endpoint):

```env
VITE_API_URL=http://localhost:5000
```

### Database Setup

Create the MySQL database and tables:

```sql
CREATE DATABASE IF NOT EXISTS ai_doc_generator;

USE ai_doc_generator;

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY,
  repo_url TEXT NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  progress INT DEFAULT 0,
  result_path TEXT,
  error_message TEXT,
  result LONGTEXT,
  readme_md LONGTEXT,
  developer_guide_md LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Running the Application

**Terminal 1 - Backend Server:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Background Worker:**

```bash
cd backend
npm run worker
```

**Terminal 3 - Frontend:**

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📚 API Documentation

### Create Documentation Job

**Endpoint:** `POST /api/jobs`

**Request Body:**
```json
{
  "repoUrl": "https://github.com/username/repository"
}
```

**Response:**
```json
{
  "jobId": "uuid-string",
  "status": "pending"
}
```

### Get Job Status and Documents

**Endpoint:** `GET /api/jobs/:jobId`

**Response:**
```json
{
  "id": "uuid-string",
  "status": "completed",
  "progress": 100,
  "documents": {
    "readme": "# Project README...",
    "developerGuide": "# Developer Guide..."
  }
}
```

### Download Developer Guide as PDF

**Endpoint:** `GET /api/jobs/:jobId/developer-guide.pdf`

**Response:** Binary PDF file

## 🔄 How It Works

1. **Job Creation**: User submits a GitHub repository URL
2. **Queue Processing**: Job is added to BullMQ queue with Redis backend
3. **Repository Cloning**: Background worker clones the repository
4. **Analysis Phase**:
   - Detects repository type and tech stack
   - Identifies entry points and routing
   - Analyzes database schemas
   - Extracts environment variables
   - Generates folder structure tree
5. **AI Documentation**: OpenRouter API generates comprehensive documentation
6. **Document Storage**: Generated documents are stored in MySQL
7. **Frontend Display**: User views and can download the generated documentation

## 🛠️ Available Scripts

### Backend

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run worker` - Start background job worker

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🔐 Security Considerations

- Secure your `.env` file - never commit credentials to version control
- Use strong MySQL passwords
- Keep your OpenRouter API key confidential
- Validate all incoming repository URLs
- Implement rate limiting for API endpoints in production
- Use HTTPS in production environment

## 🐛 Troubleshooting

### MySQL Connection Error
- Ensure MySQL is running
- Verify credentials in `.env` file
- Check database exists and tables are created

### Redis Connection Error
- Ensure Redis is running on the specified host/port
- Check Redis configuration in `config/redis.js`

### OpenRouter API Error
- Verify API key is valid and has available credits
- Check API rate limits haven't been exceeded
- Ensure repository is accessible and public

### Frontend Not Connecting to Backend
- Check CORS settings in `backend/src/app.js`
- Verify backend is running on correct port
- Check frontend environment variables

## 📝 Environment Variables

### Backend (.env)
- `DB_HOST` - MySQL host (use `mysql` when running with Docker)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name
- `REDIS_HOST` - Redis host (use `redis` when running with Docker)
- `REDIS_PORT` - Redis port (default: 6379)
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `PORT` - Server port (default: 5000)
- `CORS_ORIGIN` - Allowed frontend origin

## 🎨 Features in Detail

### Repository Analysis

The system performs deep analysis including:
- Technology stack detection (frameworks, libraries, languages)
- Entry point identification
- API route discovery
- Database schema analysis
- Authentication mechanism detection
- Environment variable extraction
- Project folder structure mapping

### Documentation Generation

Generated documentation includes:
- **README**: Quick start guide, features, installation, usage
- **Developer Guide**: Architecture overview, code structure, module descriptions, API documentation

### Real-time Progress Updates

Users can monitor job progress with percentage completion and current processing step:
- Initializing job
- Cloning repository
- Analyzing codebase
- Understanding architecture
- Generating documentation
- Finalizing output

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for developers who love documentation**