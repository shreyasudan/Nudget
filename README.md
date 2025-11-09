# Nudget - Smart Personal Finance for the Next Generation

## Description

Nudget is a comprehensive personal finance management platform designed specifically for young adults, students, and freelancers navigating the complexities of modern financial life. Unlike traditional budgeting apps that assume stable incomes and predictable expenses, Nudget embraces the reality of variable income, subscription proliferation, and the unique financial challenges faced by the gig economy generation.

Our mission is to make financial wellness accessible and actionable for everyone, regardless of their financial expertise or income stability. Nudget transforms overwhelming financial data into clear, actionable insights that help users build sustainable financial habits.

### Who is Nudget for?
- **Young Adults & Students** looking to build good financial habits early
- **Freelancers & Gig Workers** managing variable income and irregular expenses
- **Anyone** seeking to understand their spending patterns and find real savings opportunities

### What makes Nudget different?
- **Built for Variable Income:** Handles irregular payment patterns with ease
- **Subscription Intelligence:** Automatically detects and flags forgotten subscriptions
- **Proactive Guidance:** Smart alerts that prevent problems, not just report them
- **Privacy-First:** Your financial data stays yours - no selling to third parties

## Core Capabilities

### 📊 **Intelligent Financial Dashboard**
- Real-time overview of income, expenses, and savings
- Interactive spending breakdowns with drill-down capabilities
- Monthly trend analysis adapted for variable income patterns
- Current month focus for relevant, actionable insights

### 🔍 **Automatic Subscription Detection**
- Identifies recurring charges with 60%+ confidence scoring
- Discovers "gray charges" - forgotten subscriptions costing you monthly
- Tracks upcoming payments and renewal dates
- Calculates total subscription spend and potential savings

### 🎯 **Smart Goal Setting & Tracking**
- Create financial goals with target amounts and deadlines
- AI-powered completion date predictions based on saving patterns
- Progress celebrations and motivational alerts at milestones
- Personalized savings recommendations to meet targets

### 💰 **Adaptive Budget Management**
- Category-specific and overall spending limits
- Early warning system when spending too fast (80% at mid-month)
- Real-time tracking against budget targets
- Daily spending limit calculations for budget adherence

### 🚨 **Proactive Alert System**
- **Goal Progress:** Encouragement and projections when nearing targets
- **Budget Warnings:** Early alerts to prevent overspending
- **Anomaly Detection:** ML-powered unusual transaction identification
- **Subscription Reminders:** Never miss expected payments
- **Gray Charge Alerts:** Notifications about potentially forgotten services

### 🤖 **Advanced Anomaly Detection**
- Dual approach: Statistical analysis + Machine Learning
- Isolation Forest algorithm for pattern recognition
- Z-score calculations for statistical outliers
- Contextual analysis by merchant and category

### 📁 **Flexible Data Import**
- CSV and JSON file upload support
- Automatic transaction categorization
- Bulk import from bank statements
- Historical data analysis up to years back

### 🔐 **Secure Authentication**
- JWT token-based authentication
- Encrypted password storage
- Protected API endpoints
- Secure session management

## How to Run

### Prerequisites
- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn package manager

### Backend Setup

1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Create and activate a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:///./nudget.db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. **Initialize the database:**
```bash
python -m app.database
```

6. **Run the backend server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`
API documentation is available at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to the frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables:**
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Run the development server:**
```bash
npm run dev
# or
yarn dev
```

The frontend application will be available at `http://localhost:3000`

### Demo Account

For testing purposes, you can use the pre-configured demo account:

**Email:** alex.demo@nudget.app
**Password:** Demo123!

This demo account includes:
- 6 months of realistic transaction history
- Variable freelance income patterns
- Multiple subscriptions (including hidden ones to discover)
- Typical young adult spending patterns

To create the demo data, run from the backend directory:
```bash
python create_demo_data.py
```

### Quick Start (Both Services)

For convenience, you can start both backend and frontend simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Troubleshooting

**Backend Issues:**
- Ensure Python 3.12+ is installed: `python --version`
- Check all dependencies are installed: `pip list`
- Verify database exists: Check for `nudget.db` in backend directory
- Port 8000 in use: Change port with `--port 8001`

**Frontend Issues:**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)
- Port 3000 in use: The app will automatically try 3001

**Database Issues:**
- Reset database: Delete `nudget.db` and restart backend
- Create fresh demo data: `python create_demo_data.py`

## Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight, serverless database
- **Scikit-learn** - Machine learning for anomaly detection
- **Python-JOSE** - JWT token implementation
- **Pandas & NumPy** - Data analysis and processing

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Composable charting library
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library

## Project Structure

```
Nudget/
├── backend/
│   ├── app/
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── auth.py           # Authentication logic
│   │   ├── database.py       # Database configuration
│   │   ├── main.py           # FastAPI application
│   │   ├── routers/          # API endpoints
│   │   └── services/         # Business logic
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── app/                  # Next.js app router
│   ├── components/           # React components
│   ├── lib/                  # Utilities and API client
│   ├── public/              # Static assets
│   └── package.json         # Node dependencies
└── README.md                # This file
```

## License

This project is proprietary software. All rights reserved.

## Contact

For questions, suggestions, or support, please contact the development team.

---

Built with ❤️ for the next generation of financially conscious individuals.