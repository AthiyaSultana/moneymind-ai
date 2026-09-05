# MoneyMind AI

> **Turn everyday conversations into smarter financial decisions.**

MoneyMind AI is a secure, AI-powered personal finance assistant built on
a Gemini Journal foundation. It combines conversational financial
journaling with expense tracking, income and savings management,
analytics, and an **Ask My Money** assistant.

Built for the **Google Cloud Gen AI Academy APAC Edition Ideathon /
Hack2Skill AI application challenge**, with security, privacy,
authentication, and user data isolation as first-class requirements.

## 🚀 Live Application

**Cloud Run:**\
https://moneymind-ai-255312101511.asia-south1.run.app

**GitHub:**\
https://github.com/AthiyaSultana/moneymind-ai

------------------------------------------------------------------------

## ✨ Features

### 🔐 Secure Authentication

-   Firebase Authentication with Email/Password.
-   Protected APIs require a Firebase ID token.
-   Backend verifies the token with Firebase Admin SDK.
-   The verified Firebase UID is the only identity used for database
    access.
-   The client never supplies a trusted UID through body, URL, or query
    parameters.

### 💬 MoneyMind Journal

-   Multi-turn conversational financial journal.
-   Users can naturally record financial thoughts and transactions.
-   Journal entries are stored under the authenticated user's UID.
-   Safe fallback responses keep the journal usable when Gemini is
    temporarily unavailable.

### 💰 Intelligent Expense Tracking

Users can write natural-language expenses such as:

> "I spent ₹850 on Swiggy yesterday."

The application can extract: - Amount - Merchant - Category - Date -
Description

The user reviews and confirms the transaction before it is persisted.

### 🛡️ Resilient Expense Detection

If Gemini is unavailable because of quota or a handled temporary
failure: 1. The journal entry is still saved. 2. A conservative
deterministic fallback parser attempts expense detection. 3. Meaningful
financial intent is surfaced as a possible expense. 4. The user reviews
the extracted details. 5. The expense is saved only after confirmation.

The fallback does not invent a missing financial amount.

### 📊 Dashboard

Shows: - Total income - Total expenses - Total savings - Available
balance - Savings rate - Transaction count - Top spending category -
Recent activity - Category breakdown

### 📈 Analytics

Provides: - Monthly income - Monthly expenses - Monthly savings -
Available balance - Savings rate - Spending by category - Recent monthly
trends

### 💵 Income Tracking

Users can add and view income records including source, amount, date,
and description.

### 🏦 Savings Tracking

Users can record savings contributions and goals.

### 🤖 Ask My Money

Users can ask questions such as: - "How much did I spend this month?" -
"What is my top spending category?" - "How much income did I receive?" -
"What is my available balance?" - "How much have I saved?"

The backend calculates the user's financial summary from Firestore and
provides Gemini only the minimum relevant information required to answer
the question.

If Gemini is unavailable, a deterministic fallback answer is returned
from the calculated financial data.

> **Financial disclaimer:** MoneyMind AI provides informational
> financial insights based on the user's recorded data. It does not
> provide professional financial, investment, tax, or legal advice.

------------------------------------------------------------------------

# 🏗️ Architecture

``` text
User / Web
    |
    v
React + Vite UI
    |
    | Firebase ID Token
    v
Node.js / Express on Cloud Run
    |
    +------------------+------------------+
    |                  |                  |
    v                  v                  v
Firebase Admin      Gemini API        Firestore
    |                                    |
    |                              users/{uid}/...
    |
    +--> Verified Firebase UID

Gemini API key -> Google Cloud Secret Manager
```

------------------------------------------------------------------------

# 🧰 Tech Stack

## Frontend

-   React
-   Vite
-   JavaScript / JSX
-   Tailwind CSS
-   Firebase Authentication
-   Firebase Web SDK

## Backend

-   Node.js
-   Express
-   Firebase Admin SDK
-   Firestore
-   Google Gemini API
-   `@google/genai`

## Google Cloud

-   Cloud Run
-   Cloud Build
-   Secret Manager
-   Firestore
-   Firebase Authentication

## Development / Deployment

-   GitHub
-   Docker
-   Cloud Build continuous deployment

------------------------------------------------------------------------

# 🔐 Security Architecture

Security was designed into the application rather than added only at
deployment time.

## 1. Firebase Authentication

Every protected backend route uses Firebase authentication middleware.

The client sends:

``` http
Authorization: Bearer <Firebase-ID-token>
```

The backend verifies the token using Firebase Admin SDK.

The verified UID is then used for all database operations.

## 2. Never Trust a Client-Supplied UID

The backend does not trust:

::: {#cb3 .sourceCode}
``` {.sourceCode .js}
req.body.uid
req.query.uid
req.params.uid
```
:::

for authorization.

Instead:

::: {#cb4 .sourceCode}
``` {.sourceCode .js}
const uid = req.user.uid;
```
:::

The UID comes from the verified Firebase ID token.

This prevents a user from changing a request parameter to access another
user's data.

------------------------------------------------------------------------

# 🗄️ Firestore Data Isolation

User data is stored under the authenticated user's UID:

``` text
users/
  {uid}/
    journalEntries/
      {entryId}

    expenses/
      {expenseId}

    income/
      {incomeId}

    savings/
      {savingId}
```

This creates a clear ownership boundary between users.

## Firestore Security Rules

``` firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/journalEntries/{entryId} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/expenses/{expenseId} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/income/{incomeId} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/savings/{savingId} {
      allow read, write: if isOwner(userId);
    }

    function isOwner(userId) {
      return request.auth != null
             && request.auth.uid == userId;
    }
  }
}
```

These rules ensure authenticated users can access only their own
user-scoped documents.

------------------------------------------------------------------------

# 🛡️ Backend Authorization

The backend verifies Firebase authentication before accessing protected
resources.

This is especially important because the Firebase Admin SDK bypasses
client-side Firestore Security Rules.

Therefore:

``` text
Client
  ↓
Firebase ID Token
  ↓
Backend verifies token
  ↓
Verified UID
  ↓
Firestore query scoped to verified UID
```

The application never uses a client-provided UID as the authorization
source.

------------------------------------------------------------------------

# 🔑 Secret Management

The Gemini API key is **not stored in source code**.

Production uses:

**Google Cloud Secret Manager**

Secret:

``` text
gemini-api-key
```

Cloud Run exposes it to the application as:

``` text
GEMINI_API_KEY
```

The production secret is referenced by version rather than hardcoded
into the repository.

The repository does not contain: - Gemini API keys - Firebase Admin
service account private keys - Production `.env` files - Service account
JSON credentials

Local secret files are excluded using `.gitignore` and `.dockerignore`.

------------------------------------------------------------------------

# ☁️ Cloud Run Security

The application runs on Cloud Run using a dedicated user-managed service
account:

``` text
moneymind-cloud-run@moneymind-ai-96dd9.iam.gserviceaccount.com
```

The service account has the required permissions for: - Firestore
access - Secret Manager access to the Gemini API key

Production Google Cloud authentication uses the Cloud Run service
identity and Application Default Credentials.

No service account private key is required inside the production
container.

------------------------------------------------------------------------

# 🤖 Gemini Integration

Gemini is used for: - Multi-turn journal responses - Natural-language
expense extraction - Financial question answering

Gemini responses are treated as untrusted model output.

The application validates and constrains extracted financial information
before persistence.

Supported expense categories:

``` text
Groceries
Dining
Transport
Shopping
Entertainment
Travel
Bills
Healthcare
Housing
Utilities
Subscriptions
Other
```

The application does not blindly persist arbitrary model output.

------------------------------------------------------------------------

# 🧠 AI Security Principles

## Threat Modeling

The application considers: - Authentication bypass - Cross-user data
access - Prompt injection - Sensitive data leakage - Secret exposure -
Invalid model output - Unauthorized database writes - Excessive logging
of private information

## Prompt Injection Protection

User messages are treated as untrusted input.

Instructions inside user messages must not override application security
behavior.

## Model Output Validation

Gemini output is parsed and validated before application logic uses it.

Validation includes: - Expected response structure - Expense
classification - Amount validity - Supported category - Date format -
Required values before persistence

------------------------------------------------------------------------

# 🔄 Gemini Failure Handling

Gemini availability should not make the application unusable.

## Journal

``` text
User message
     ↓
Journal entry saved
     ↓
Gemini unavailable
     ↓
Safe fallback response
```

## Expense Detection

``` text
User message
     ↓
Gemini extraction
     ↓
Failure
     ↓
Deterministic fallback parser
     ↓
Confidence-based detection
     ↓
User confirmation
     ↓
Firestore
```

The fallback parser is intentionally conservative and does not invent
missing financial values.

## Ask My Money

Ask My Money calculates financial totals from Firestore first.

Only the minimum relevant financial summary is provided to Gemini.

If Gemini is unavailable, a deterministic response is returned from the
calculated data.

------------------------------------------------------------------------

# 💬 Multi-Turn Journal

The Journal supports conversational history.

The backend: 1. Authenticates the user. 2. Retrieves only that user's
journal entries. 3. Converts stored messages into the appropriate Gemini
conversation format. 4. Sends the conversation context to Gemini. 5.
Saves the assistant response under the same authenticated user's UID.

------------------------------------------------------------------------

# 💰 Expense Confirmation Flow

MoneyMind AI intentionally does **not** automatically persist an
AI-detected transaction.

Example:

``` text
User:
"I spent ₹850 on Swiggy yesterday."

        ↓

Expense extraction

        ↓

Expense detected

Amount: ₹850
Merchant: Swiggy
Category: Dining
Date: YYYY-MM-DD

        ↓

User reviews

        ↓

Add Expense

        ↓

Firestore
```

This confirmation step reduces the risk of incorrect AI extraction
creating unintended financial records.

If a date is not mentioned, the user can review the missing date and the
save flow can use the current date as the default transaction date.

------------------------------------------------------------------------

# 📊 Financial Calculations

Dashboard and Analytics calculations are performed from the
authenticated user's stored records.

``` text
Available Balance
= Total Income - Total Expenses - Total Savings
```

``` text
Savings Rate
= Total Savings / Total Income × 100
```

The application does not ask Gemini to invent financial totals.

------------------------------------------------------------------------

# 🗂️ Project Structure

``` text
MONEYMIND-AI/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   └── server.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── config/
│   │   └── ...
│   │
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── Dockerfile
├── .dockerignore
├── .gitignore
├── firestore.rules
├── firestore.indexes.json
└── README.md
```

------------------------------------------------------------------------

# 🧪 Security Testing

The application was tested using separate Firebase Authentication users.

Example:

``` text
User A
  ↓
users/{UserA_UID}/expenses

User B
  ↓
users/{UserB_UID}/expenses
```

User A cannot read or write User B's user-scoped data through the
Firebase client.

The backend additionally derives ownership from the verified Firebase
token.

------------------------------------------------------------------------

# 🐳 Run Locally

## Prerequisites

-   Node.js 20+
-   npm
-   Firebase project
-   Firebase Authentication
-   Firestore
-   Gemini API access
-   Docker Desktop (optional)

## 1. Clone

::: {#cb19 .sourceCode}
``` {.sourceCode .bash}
git clone https://github.com/AthiyaSultana/moneymind-ai.git
cd moneymind-ai
```
:::

## 2. Backend

::: {#cb20 .sourceCode}
``` {.sourceCode .bash}
cd backend
npm install
```
:::

Create:

``` text
backend/.env
```

Example:

``` env
PORT=5001
GEMINI_API_KEY=your-gemini-api-key
```

Do not commit the real `.env` file.

## 3. Frontend

::: {#cb23 .sourceCode}
``` {.sourceCode .bash}
cd ../frontend
npm install
```
:::

Create:

``` text
frontend/.env
```

For local development:

``` env
VITE_API_URL=http://localhost:5001
```

## 4. Start Backend

From `backend/`:

::: {#cb26 .sourceCode}
``` {.sourceCode .bash}
npm run dev
```
:::

Backend:

``` text
http://localhost:5001
```

Health check:

``` text
http://localhost:5001/health
```

## 5. Start Frontend

From `frontend/`:

::: {#cb29 .sourceCode}
``` {.sourceCode .bash}
npm run dev
```
:::

Open the Vite development URL shown in the terminal.

------------------------------------------------------------------------

# 🐳 Docker

The repository contains a multi-stage Dockerfile.

Stage 1 builds the React frontend.

Stage 2 runs the Node.js production backend and serves the React
production build.

Build:

::: {#cb30 .sourceCode}
``` {.sourceCode .bash}
docker build -t moneymind-ai .
```
:::

Run:

::: {#cb31 .sourceCode}
``` {.sourceCode .bash}
docker run --rm   --name moneymind-local   -p 8080:8080   --env-file backend/.env   moneymind-ai
```
:::

Health check:

``` text
http://localhost:8080/health
```

Production Cloud Run authentication uses the Cloud Run service identity
and Application Default Credentials.

------------------------------------------------------------------------

# ☁️ Cloud Run Deployment

MoneyMind AI is deployed using: - Google Cloud Run - Cloud Build -
GitHub - Dockerfile - Secret Manager - Dedicated Cloud Run service
account

## Deployment Configuration

``` text
Service:
moneymind-ai

Region:
asia-south1 (Mumbai)

Container Port:
8080

Authentication:
Public

Minimum Instances:
0

Maximum Instances:
5

CPU:
1

Memory:
512 MiB

Ingress:
All
```

The application itself protects financial APIs using Firebase
Authentication.

------------------------------------------------------------------------

# 🔁 Continuous Deployment

The Cloud Run service is connected to the GitHub repository using Cloud
Build.

Branch:

``` text
main
```

A push to `main` triggers the configured build and deployment process.

``` text
git push
   ↓
GitHub
   ↓
Cloud Build
   ↓
Docker build
   ↓
Artifact Registry
   ↓
Cloud Run revision
   ↓
Production application
```

------------------------------------------------------------------------

# 🏷️ Challenge Deployment Label

The Cloud Run service includes the required challenge label:

``` text
dev-tutorial=cloud-run-ai-challenge
```

------------------------------------------------------------------------

# 🧩 Original Feature Enhancement

The base Gemini Journal concept was extended into **MoneyMind AI**, a
personal financial assistant.

Original enhancements include:

### 1. Intelligent Expense Tracking

Natural-language financial messages can be converted into structured
expense candidates.

### 2. Expense Confirmation

The user reviews extracted information before the transaction is
persisted.

### 3. Resilient Local Expense Detection

Controlled expense detection continues when Gemini is temporarily
unavailable.

### 4. Ask My Money

Users can ask financial questions using their own stored financial data.

### 5. Financial Dashboard and Analytics

Stored financial records are converted into useful summaries and
spending insights.

These enhancements turn the basic journal concept into a more complete
personal finance experience.

------------------------------------------------------------------------

# 🎯 Challenge Compliance

## Phase 1 --- Secure AI Development

Implemented security-focused development instructions covering: - Threat
modeling - Secure coding - Authentication - Firestore isolation - Secret
management - Prompt injection - Input validation - AI output
validation - Privacy - Least privilege

These instructions were configured in Google AI Studio Custom
Instructions.

## Phase 2 --- Authenticated Gemini Journal

Implemented: - Firebase Authentication - Multi-turn Gemini Journal -
Firestore user isolation - Backend token verification - User-scoped
database access - Cloud Run deployment - Secret Manager integration

## Phase 3 --- Original Enhancement

Implemented: - Natural-language expense extraction - Expense
confirmation workflow - Deterministic expense fallback - Dashboard -
Analytics - Income tracking - Savings tracking - Ask My Money financial
assistant

------------------------------------------------------------------------

# 🔍 Production Security Checklist

-   [x] Firebase Authentication enabled
-   [x] Email/Password authentication tested
-   [x] Firestore Security Rules published
-   [x] User isolation tested
-   [x] Backend verifies Firebase ID tokens
-   [x] Backend uses verified UID
-   [x] No client-supplied UID used for authorization
-   [x] Gemini API key stored in Secret Manager
-   [x] Production service account private key not stored in repository
-   [x] `.env` files excluded from Git
-   [x] Service account JSON excluded from Git
-   [x] Docker build tested
-   [x] Cloud Run deployment completed
-   [x] Cloud Run service account configured
-   [x] Firestore IAM configured
-   [x] Required Cloud Run label configured
-   [x] GitHub repository public
-   [x] Cloud Build continuous deployment configured

------------------------------------------------------------------------

# 📌 API Overview

## Health

``` http
GET /health
```

## Journal

``` http
GET /api/journal
POST /api/journal
POST /api/journal/message
```

## Expenses

``` http
GET /api/expenses
POST /api/expenses/extract
POST /api/expenses/save
```

## Income

``` http
GET /api/income
POST /api/income
```

## Savings

``` http
GET /api/savings
POST /api/savings
```

## Ask My Money

``` http
POST /api/ask-money
```

Protected APIs require:

``` http
Authorization: Bearer <Firebase-ID-token>
```

------------------------------------------------------------------------

# 🛡️ Privacy

MoneyMind AI is designed around user-level data isolation.

The application: - Uses Firebase Authentication. - Derives user identity
from a verified token. - Stores records under the authenticated user's
UID. - Does not intentionally expose one user's financial records to
another user. - Does not send unnecessary raw Firestore data to
Gemini. - Does not store API secrets in the GitHub repository.

------------------------------------------------------------------------

# 📜 License

This project was created as an educational / hackathon prototype for the
Google Cloud Gen AI Academy APAC Edition Ideathon.

------------------------------------------------------------------------

# 👩‍💻 Author

**Athiya Sultana**

GitHub:\
https://github.com/AthiyaSultana

Project:\
https://github.com/AthiyaSultana/moneymind-ai

------------------------------------------------------------------------

# 🙌 Acknowledgements

Built using Google Cloud, Firebase, Gemini, React, Node.js, Express,
Firestore, Cloud Run, Cloud Build, and Secret Manager.

------------------------------------------------------------------------

## MoneyMind AI

> **Turn everyday conversations into smarter financial decisions.**
