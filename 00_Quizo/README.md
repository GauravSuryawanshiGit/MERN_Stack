# Quizo — Enterprise Production Quiz Platform

Quizo is a high-reliability, full-stack quiz and assessment platform built with **Node.js, Express.js, MongoDB Atlas, and EJS**. Redesigned with a government-grade **Seva Setu inspired portal layout**, Quizo features an advanced **zero-repetition quiz engine** backed by a verified **3,250+ seeded question bank** across 3 foundational domains and 33 specialized categories.

---

## 🏛 1. Seva Setu Design Architecture

Quizo follows the clean, professional, and accessible design principles of the Seva Setu portal:

- **Full-Width Solid Navigation Bar (`#0F766E`)**: High-contrast, brand-aligned deep teal navbar featuring the Quizo brand emblem and subtitle on the left, with primary navigation links and user session controls aligned to the right.
- **Accent Border (`#14B8A6`)**: A crisp 3px accent line underneath the header cleanly demarcating navigation from the workspace.
- **Large White Content Panel (`.quizo-panel`)**: Centralized card with generous whitespace, subtle 1px border (`#E2E8F0`), and gentle elevation (`0 4px 6px -1px rgba(0,0,0,0.05)`).
- **Left-Aligned Content Flow**: Large, legible headings (`h1.panel-title`), concise subtitles (`.panel-subtitle`), and vertically stacked forms and tables avoiding nested card clutter.
- **Rectangular Action Buttons**: Standardized primary (`.btn-quizo-primary`) and secondary (`.btn-quizo-secondary`) buttons with consistent 4px border radius.
- **Minimal, Functional Footer**: Structured links (Home, Explore Categories, Leaderboards, Privacy) and copyright without non-existent placeholders.

---

## 🧠 2. Core Quiz Engine & Zero-Repetition Logic

### The Repetition Problem & Solution
In traditional quiz apps, random database sampling often presents repeat questions across sessions, degrading the user experience. Quizo implements **persistent, atomic question history**:

1. **Persistent History (`UserQuestionHistory`)**: Every question presented to an authenticated user (`userId`) or guest learner (`guestId`) is immediately logged upon quiz creation with status `presented`.
2. **Exclusion Querying**: Future quiz queries execute `$nin: seenQuestionIds` at the database level using compound covered indexes, ensuring previously presented questions are never selected again.
3. **Session Interruption & Abandonment Protection**: Questions are marked as presented when the quiz attempt is generated. Page refreshes, network disconnects, or abandoned tabs never recycle those questions.
4. **Exhaustion Handling**: When all questions in a category have been consumed, the engine returns an `EXHAUSTED` state. The user is presented with options to switch categories or trigger an **explicit, user-authorized reset**.
5. **Partial Availability**: If fewer questions remain than requested, the engine provides an `INSUFFICIENT` prompt allowing the user to take a shorter assessment or reset their history.
6. **Guest Identity Tracking**: Unauthenticated learners receive a cryptographically random, persistent cookie identifier (`quizo_guest_id`), preserving zero repetition across anonymous sessions.

### Assessment Security & Evaluation
- **Zero Frontend Leakage**: The `correctAnswer` and question explanation fields are completely stripped from client HTML templates.
- **Backend Scoring**: All answers are validated server-side against canonical database records upon submission.
- **Timer Auto-Submission**: Synchronized countdown timer automatically triggers submission when remaining time reaches 0.
- **Idempotent Submission**: Duplicate submissions or accidental double-clicks return the existing result record without duplicating attempts or double-crediting XP.

---

## 📚 3. Multi-Domain Taxonomy & 3,250+ Question Bank

The question bank contains **3,250 active, curated questions** structured across 3 distinct domains:

### Domain 1: Programming & Computer Science (1,480+ questions)
- **Languages**: Java, Python, C, C++, JavaScript
- **Core CS**: Data Structures & Algorithms (DSA), Object-Oriented Programming (OOP), Database Management Systems (DBMS), Operating Systems (OS), Computer Networks (CN), Computer Organization & Architecture (COA), Software Engineering
- **Modern Technologies**: Web Development, REST APIs, Git & GitHub, Cybersecurity, Cloud Computing, Generative AI & Machine Learning

### Domain 2: Placements & Competitive Exams (880+ questions)
- Quantitative Aptitude, Logical Reasoning, Verbal Ability & Reading Comprehension, English Grammar, Data Interpretation, Coding & Technical MCQs, Code Debugging, Interview Preparation

### Domain 3: General Knowledge & Everyday Aptitude (890+ questions)
- General Computer Awareness, Indian History & Heritage, World Geography & Climate, General Science (Physics, Chemistry, Biology), Financial Literacy & Banking, Current Affairs & General Knowledge

---

## 🛠 4. Technology Stack

- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js 5.x
- **Database**: MongoDB Atlas via Mongoose 8.x
- **Session Management**: `express-session` with `connect-mongo`
- **Authentication**: `bcrypt` password hashing with salted rounds
- **Frontend / Templating**: EJS (Embedded JavaScript), Bootstrap 5.3, FontAwesome 6.4, Chart.js, SweetAlert2
- **Deduplication Engine**: Crypto SHA-256 fingerprint hashing with normalized question parsing

---

## 🚀 5. Installation & Local Setup

### Prerequisites
- Node.js >= 18.0.0
- MongoDB connection URI (local MongoDB instance or MongoDB Atlas)

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd 00_Quizo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=8080
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/quizo?retryWrites=true&w=majority
   SESSION_SECRET=quizo-production-secret-key-2026
   GEMINI_API_KEY=your_optional_gemini_api_key
   ```

4. **Seed the Question Bank**:
   Generate normalized questions and seed the MongoDB collection:
   ```bash
   # Generates 3,250 question dataset
   npm run build:dataset

   # Inserts and validates all questions into MongoDB Atlas
   npm run seed
   ```

5. **Start the Application**:
   ```bash
   # Production mode
   npm start

   # Development mode
   npm run dev
   ```
   Open your browser at `http://localhost:8080`.

---

## 🧪 6. Automated Testing

Quizo includes a comprehensive dual-tier test suite covering both the database quiz engine and end-to-end HTTP routes:

```bash
# Run all test suites
npm test

# Run quiz engine unit & integration tests only (36 assertions)
npm run test:engine

# Run HTTP routes and session end-to-end tests only (13 suites)
npm run test:e2e
```

### Verified Test Assertions
- ✅ **Question Bank Validation**: Verifies $\ge$ 3,000 active questions, rejects malformed schemas, and checks normalized SHA-256 fingerprint deduplication.
- ✅ **Zero Repetition Verification**: Verifies question uniqueness across consecutive quizzes for User A, ensures User B has an independent history, and confirms abandoned quizzes never recycle questions.
- ✅ **Exhaustion & Explicit Reset**: Confirms `EXHAUSTED` response upon full consumption and verifies that questions only become available after authorized reset.
- ✅ **Scoring & Idempotency**: Accurately computes correct, incorrect, and skipped counts, evaluates accuracy percentage, and verifies duplicate submissions are idempotent.
- ✅ **Security Check**: Verifies that `correctAnswer` is never leaked in client HTML.
- ✅ **E2E Route Verification**: 100% pass on Homepage, Authentication, Dashboard, Achievements, Profile, Quiz Start, Quiz Submit, and 404 pages.

---

## 📁 7. Repository Directory Structure

```text
00_Quizo/
├── config/
│   └── quizDomains.js          # Master taxonomy of domains and categories
├── data/
│   ├── questions.json          # Curated seed questions
│   └── questions_3000.json     # 3,250 verified question dataset
├── models/
│   ├── Achievement.js          # Gamification achievements model
│   ├── Question.js             # Question schema with SHA-256 textHash index
│   ├── QuizAttempt.js          # Attempt state machine and duration tracking
│   ├── Result.js               # Historical quiz results and XP awards
│   ├── User.js                 # Learner credentials, level, and stats
│   └── UserQuestionHistory.js  # Zero-repetition tracking with partialFilterExpression
├── public/
│   ├── css/
│   │   └── style.css           # Seva Setu portal styles and CSS variables
│   └── js/
│       └── main.js             # UI helpers, SweetAlert2 confirm dialogs
├── routes/
│   ├── authRoutes.js           # Login, signup, logout
│   ├── profileRoutes.js        # User profiles, avatar editing
│   ├── quizRoutes.js           # Quiz generation, submission, reset endpoints
│   └── staticRoutes.js         # Home, dashboard, leaderboard, achievements
├── scripts/
│   └── buildDataset.js         # Algorithmic dataset builder (3,250 unique MCQs)
├── services/
│   ├── quizService.js          # Core zero-repetition quiz engine
│   └── seederService.js        # Seeder validation and fingerprinting
├── tests/
│   └── quiz-engine.test.js     # 36-assertion engine integration test
├── views/
│   ├── partials/
│   │   ├── header.ejs          # Seva Setu solid navbar & accent line
│   │   └── footer.ejs          # Minimal footer & scripts
│   ├── quiz/
│   │   ├── quiz.ejs            # Step quiz interface with palette & timer
│   │   ├── result.ejs          # Performance summary & breakdown
│   │   ├── review.ejs          # Post-quiz question review with explanations
│   │   ├── exhausted.ejs       # Category completed notification & reset
│   │   └── insufficient.ejs    # Insufficient questions prompt
│   ├── index.ejs               # Home page with category selector & unseen counter
│   ├── dashboard/              # User analytics and history
│   ├── leaderboard/            # Global XP and accuracy rankings
│   └── errors/
│       └── 404.ejs             # Clean error page
├── app.js                      # Express application entrypoint
├── seedQuestions.js            # Database seeder execution script
├── test-e2e-routes.js          # E2E HTTP route test suite
└── package.json                # Project configuration & npm scripts
```

---

## 🚢 8. Production Deployment Guide

1. **Process Management**:
   Use PM2 or Docker in production:
   ```bash
   npm install -g pm2
   pm2 start app.js --name "quizo-portal" -i max
   ```

2. **MongoDB Atlas Index Verification**:
   Ensure compound indexes are synced on startup:
   - `Question`: `{ textHash: 1 }`, `{ domain: 1, category: 1, difficulty: 1, isActive: 1 }`
   - `UserQuestionHistory`: `{ userId: 1, questionId: 1 }` (partialFilterExpression: `userId is ObjectId`), `{ guestId: 1, questionId: 1 }` (partialFilterExpression: `guestId is string`)

3. **Reverse Proxy (Nginx)**:
   Forward port 80/443 to `localhost:8080` with WebSocket support enabled for real-time capabilities.

---

## 📄 License
ISC © Quizo Engineering Team
