# Nudget - Smart Financial Coach

A minimal yet effective financial management application with **multi-user authentication** that helps users gain insights into their personal spending, detect subscriptions and anomalies, and set savings goals.

## Features

### Core Functionality
- **User Authentication**: Secure registration/login with JWT tokens and user data isolation
- **Transaction Management**: Upload and analyze financial transactions via CSV/JSON
- **Spending Overview Dashboard**: Interactive visualizations of income, expenses, and savings
- **Subscription Detection**: Automatically identifies recurring charges and potential "gray charges"
- **Anomaly Detection**: ML-powered detection of unusual spending patterns
- **Goal Tracking**: Set and monitor progress toward financial goals
- **Security-First Design**: Password hashing, JWT tokens, user isolation, input validation

### Technical Highlights
- **Backend**: FastAPI with async SQLAlchemy, automatic API documentation
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and Recharts
- **ML Models**: Isolation Forest for anomaly detection, statistical analysis for patterns
- **Real-time Updates**: Automatic detection runs on data upload

## Demo Account

For quick testing, use the demo account:
- **Email**: demo@nudget.com
- **Password**: demo1234

Or create your own account through the registration page.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Create Demo User (Optional)

To create a demo user with sample data:
```bash
cd backend
python create_demo_user.py
```

This creates:
- Demo user account (email: demo@nudget.com, password: demo1234)
- 500+ sample transactions with realistic patterns
- Pre-detected subscriptions and anomalies

## Testing with Sample Data

1. Generate sample transaction data:
```bash
cd backend
python -m app.utils.data_generator
```

This creates `sample_transactions.csv` and `sample_transactions.json` files.

2. Upload data through the UI:
   - Click "Upload Transactions" in the dashboard
   - Select the generated CSV or JSON file
   - The system will automatically:
     - Import transactions
     - Detect subscriptions
     - Identify anomalies
     - Update spending overview

## API Endpoints

### Transactions
- `POST /api/transactions/upload` - Upload transaction file
- `GET /api/transactions` - List transactions
- `GET /api/transactions/overview` - Spending overview

### Subscriptions
- `POST /api/subscriptions/detect` - Run detection
- `GET /api/subscriptions` - List recurring charges
- `GET /api/subscriptions/gray-charges` - Identify forgotten subscriptions

### Anomalies
- `POST /api/anomalies/detect` - Run anomaly detection
- `GET /api/anomalies/summary` - Get anomaly summary

### Goals
- `POST /api/goals` - Create goal
- `GET /api/goals` - List goals
- `PUT /api/goals/{id}` - Update goal
- `POST /api/goals/{id}/progress` - Add progress

## Security Features

- Input validation on all endpoints
- Environment-based configuration
- CORS protection
- SQL injection prevention via ORM
- Prepared for encryption implementation
- Secure file upload handling

## Architecture

```
nudget/
├── backend/
│   ├── app/
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routers/           # API endpoints
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   └── requirements.txt
├── frontend/
│   ├── app/                   # Next.js pages
│   ├── components/            # React components
│   ├── lib/                   # API client
│   └── package.json
└── README.md
```

## Development

### Running Tests (Backend)
```bash
cd backend
pytest
```

### Code Quality
- Backend: Type hints, async/await patterns
- Frontend: TypeScript, ESLint
- Modular architecture for maintainability

## Future Enhancements

- Real banking API integration
- Multi-user authentication
- Advanced ML insights
- Mobile app support
- Budget recommendations
- Investment tracking

## License

MIT
