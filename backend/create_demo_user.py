import sqlite3
import uuid
from datetime import datetime, timedelta
import random
import json
from passlib.context import CryptContext

# Use bcrypt for password hashing (same as the app)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password):
    return pwd_context.hash(password)

def create_demo_user():
    conn = sqlite3.connect('nudget.db')
    cursor = conn.cursor()

    # User details
    user_id = str(uuid.uuid4())
    email = "ssudan@demo.com"
    password = "demo123"
    hashed_password = hash_password(password)
    name = "Shreya Sudan"

    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing_user = cursor.fetchone()

    if existing_user:
        # Delete existing demo user and all related data
        print(f"Deleting existing demo user...")
        cursor.execute("DELETE FROM users WHERE email = ?", (email,))
        conn.commit()

    # Create user
    cursor.execute("""
        INSERT INTO users (id, email, hashed_password, name, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?)
    """, (user_id, email, hashed_password, name, datetime.utcnow(), datetime.utcnow()))

    print(f"Created user: {email}")

    # Create budgets for early career professional (monthly income ~$4500 after tax)
    budgets = [
        ("rent", 1550),
        ("dining", 400),
        ("grocery", 200),
        ("transport", 150),
        ("entertainment", 200),
        ("shopping", 250),
        ("utilities", 120),
        ("fitness", 45),
        ("subscription", 80),
        ("personal", 75),
        ("insurance", 100),
        (None, 4500)  # Overall budget
    ]

    for category, amount in budgets:
        budget_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO budgets (id, user_id, category, amount_monthly, currency, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'USD', 1, ?, ?)
        """, (budget_id, user_id, category, amount, datetime.utcnow(), datetime.utcnow()))

    print(f"Created {len(budgets)} budgets")

    # Create goals with one near deadline
    goals = [
        ("Emergency Fund", 5000, 3500, datetime.now() + timedelta(days=6), "Build 3-month emergency fund"),
        ("New Laptop", 2000, 1200, datetime.now() + timedelta(days=45), "Save for MacBook Pro"),
        ("Vacation Fund", 3000, 800, datetime.now() + timedelta(days=120), "Summer trip to Europe"),
        ("Professional Certification", 500, 350, datetime.now() + timedelta(days=30), "AWS certification exam"),
        ("Investment Portfolio", 10000, 2100, datetime.now() + timedelta(days=365), "Start investment portfolio")
    ]

    for name, target, current, deadline, desc in goals:
        cursor.execute("""
            INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, description, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        """, (user_id, name, target, current, deadline, desc, datetime.utcnow(), datetime.utcnow()))

    print(f"Created {len(goals)} goals")

    # Create alerts for goal near deadline (Emergency Fund)
    alerts = [
        ("GOAL_PROGRESS", "Emergency Fund Deadline Approaching!",
         "Your Emergency Fund goal is due in 6 days. You're at 70% of your target ($3,500 of $5,000).",
         json.dumps({"goal": "Emergency Fund", "days_remaining": 6, "progress_percentage": 70})),

        ("GOAL_PROGRESS", "Action Required: Emergency Fund",
         "You need to save $1,500 in the next 6 days to meet your Emergency Fund goal.",
         json.dumps({"goal": "Emergency Fund", "amount_needed": 1500, "daily_required": 250})),

        ("BUDGET_WARNING", "Entertainment Budget Alert",
         "You've used 85% of your entertainment budget this month.",
         json.dumps({"category": "Entertainment", "used_percentage": 85}))
    ]

    for alert_type, title, description, metadata in alerts:
        alert_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO alerts (id, user_id, type, title, description, is_read, metadata_json, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?)
        """, (alert_id, user_id, alert_type, title, description, metadata,
              datetime.now() - timedelta(hours=random.randint(1, 48))))

    print(f"Created {len(alerts)} alerts")

    # Create recurring charges (subscriptions)
    subscriptions = [
        ("Netflix", 15.99, 30, "subscription"),
        ("Spotify", 9.99, 30, "subscription"),
        ("Amazon Prime", 14.99, 30, "subscription"),
        ("Gym Membership", 45.00, 30, "fitness"),
        ("Cloud Storage", 2.99, 30, "subscription"),
        ("Medium", 5.00, 30, "subscription"),
        ("ChatGPT Plus", 20.00, 30, "subscription"),
    ]

    for merchant, amount, freq, category in subscriptions:
        last_charge = datetime.now() - timedelta(days=random.randint(1, 29))
        next_charge = last_charge + timedelta(days=freq)
        cursor.execute("""
            INSERT INTO recurring_charges (user_id, merchant, average_amount, frequency_days,
                                          last_charge_date, next_expected_date, category, is_active,
                                          confidence_score, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        """, (user_id, merchant, amount, freq, last_charge, next_charge, category,
              0.95, datetime.utcnow()))

    print(f"Created {len(subscriptions)} recurring charges")

    # Generate transactions
    transactions = []

    # Common merchants by category
    merchants = {
        "rent": ["Property Management LLC", "Rent Payment", "Apartment Rent"],
        "dining": ["Chipotle", "Starbucks", "Subway", "Pizza Hut", "Thai Restaurant",
                   "Sushi Bar", "Mediterranean Grill", "Coffee Shop", "Burger Joint"],
        "grocery": ["Whole Foods", "Trader Joe's", "Safeway", "Kroger", "Costco"],
        "transport": ["Uber", "Lyft", "Gas Station", "Metro Card", "Parking", "Car Wash"],
        "entertainment": ["AMC Theater", "Concert Venue", "Bar & Grill", "Comedy Club",
                         "Museum", "Sports Arena", "Netflix", "Spotify"],
        "shopping": ["Amazon", "Target", "Walmart", "Best Buy", "Nike Store", "H&M",
                    "Macy's", "Apple Store", "IKEA", "Home Depot"],
        "utilities": ["Electric Company", "Internet Provider", "Water Utility", "Gas Company",
                     "Phone Bill"],
        "fitness": ["Gym Membership", "Yoga Studio", "CrossFit", "Peloton"],
        "subscription": ["Netflix", "Spotify", "Amazon Prime", "Cloud Storage",
                        "Medium", "ChatGPT Plus", "HBO Max", "Disney+"],
        "personal": ["Hair Salon", "Nail Salon", "Spa", "Barber Shop", "Beauty Store"],
        "insurance": ["Health Insurance", "Car Insurance", "Renters Insurance"],
        "social": ["Bar", "Restaurant", "Club", "Happy Hour"],
        "travel": ["Hotel", "Airbnb", "Flight", "Car Rental"],
        "income": ["TechCorp Inc - Salary", "Freelance Project", "Side Gig Payment"]
    }

    # Generate transactions for the past 3 months
    start_date = datetime.now() - timedelta(days=90)
    current_date = datetime.now()

    # Monthly salary deposits
    for month in range(3):
        salary_date = start_date + timedelta(days=30 * month + 15)
        if salary_date <= current_date:
            transactions.append({
                'date': salary_date,
                'amount': 6200,  # Gross salary
                'merchant': 'TechCorp Inc - Salary',
                'category': 'income',
                'description': 'Monthly salary deposit',
                'transaction_type': 'income'
            })

    # Regular monthly rent
    for month in range(4):
        rent_date = start_date + timedelta(days=30 * month + 1)
        if rent_date <= current_date:
            transactions.append({
                'date': rent_date,
                'amount': 1550,  # Positive amount for expenses
                'merchant': 'Property Management LLC',
                'category': 'rent',
                'description': 'Monthly rent payment',
                'transaction_type': 'expense'
            })

    # Generate diverse daily transactions
    days_to_generate = (current_date - start_date).days

    for day_offset in range(days_to_generate + 1):
        transaction_date = start_date + timedelta(days=day_offset)

        # Number of transactions per day (3-9 to ensure we get 400+ transactions)
        num_transactions = random.choices([3, 4, 5, 6, 7, 8, 9], weights=[15, 20, 25, 20, 10, 7, 3])[0]

        for _ in range(num_transactions):
            # Choose category based on realistic spending patterns
            category = random.choices(
                ["dining", "grocery", "transport", "entertainment", "shopping",
                 "utilities", "fitness", "personal", "social", "subscription"],
                weights=[25, 15, 10, 10, 15, 5, 5, 5, 5, 5]
            )[0]

            # Get merchant
            merchant = random.choice(merchants[category])

            # Generate amount based on category
            amount_ranges = {
                "dining": (8, 60),
                "grocery": (20, 150),
                "transport": (5, 50),
                "entertainment": (10, 100),
                "shopping": (15, 300),
                "utilities": (30, 150),
                "fitness": (10, 100),
                "personal": (20, 100),
                "social": (15, 80),
                "subscription": (5, 50)
            }

            min_amt, max_amt = amount_ranges.get(category, (10, 100))
            amount = round(random.uniform(min_amt, max_amt), 2)  # Positive amount for expenses

            # Add some randomness for recurring subscriptions
            if merchant in ["Netflix", "Spotify", "Amazon Prime", "Gym Membership", "Medium", "ChatGPT Plus"]:
                if random.random() < 0.1:  # 10% chance per day for subscription charge
                    transactions.append({
                        'date': transaction_date + timedelta(hours=random.randint(0, 23)),
                        'amount': amount,
                        'merchant': merchant,
                        'category': category,
                        'description': f"{merchant} subscription",
                        'transaction_type': 'expense',
                        'is_recurring': True
                    })
            else:
                transactions.append({
                    'date': transaction_date + timedelta(hours=random.randint(0, 23)),
                    'amount': amount,
                    'merchant': merchant,
                    'category': category,
                    'description': f"Purchase at {merchant}",
                    'transaction_type': 'expense'
                })

    # Add some occasional income (freelance/side gigs)
    for _ in range(5):
        income_date = start_date + timedelta(days=random.randint(0, days_to_generate))
        transactions.append({
            'date': income_date,
            'amount': round(random.uniform(200, 800), 2),
            'merchant': random.choice(['Freelance Project', 'Side Gig Payment', 'Consulting Work']),
            'category': 'Income',
            'description': 'Additional income',
            'transaction_type': 'income'
        })

    # Sort transactions by date
    transactions.sort(key=lambda x: x['date'])

    # Insert transactions into database
    for trans in transactions:
        cursor.execute("""
            INSERT INTO transactions (user_id, date, amount, merchant, category, description,
                                    transaction_type, is_recurring, is_anomaly, anomaly_score,
                                    created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, trans['date'], trans['amount'], trans['merchant'], trans['category'],
              trans['description'], trans['transaction_type'], trans.get('is_recurring', False),
              False, 0.0, datetime.utcnow(), datetime.utcnow()))

    print(f"Created {len(transactions)} transactions")

    # Commit all changes
    conn.commit()
    conn.close()

    print("\n✅ Demo user created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Total transactions: {len(transactions)}")
    print(f"Date range: {start_date.date()} to {current_date.date()}")

if __name__ == "__main__":
    create_demo_user()