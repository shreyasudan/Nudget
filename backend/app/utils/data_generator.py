import random
import csv
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np

class SyntheticDataGenerator:
    def __init__(self):
        self.merchants = {
            'grocery': ['Whole Foods', 'Trader Joes', 'Safeway', 'Kroger', 'Target Grocery'],
            'restaurant': ['Chipotle', 'Starbucks', 'McDonalds', 'Subway', 'Pizza Hut', 'Thai Express'],
            'subscription': ['Netflix', 'Spotify', 'Amazon Prime', 'Hulu', 'Disney Plus', 'Adobe Creative', 'GitHub Pro'],
            'utilities': ['PG&E Electric', 'Water Company', 'Internet Provider', 'Gas Company'],
            'transport': ['Uber', 'Lyft', 'Shell Gas Station', 'Chevron', 'Public Transit'],
            'shopping': ['Amazon', 'Best Buy', 'Apple Store', 'Walmart', 'Home Depot'],
            'entertainment': ['Movie Theater', 'Concert Venue', 'Steam Games', 'PlayStation Store'],
            'healthcare': ['CVS Pharmacy', 'Walgreens', 'Doctor Visit', 'Dentist', 'Health Insurance'],
            'fitness': ['24 Hour Fitness', 'Planet Fitness', 'Yoga Studio', 'CrossFit Gym']
        }

        self.subscription_amounts = {
            'Netflix': 15.99,
            'Spotify': 9.99,
            'Amazon Prime': 14.99,
            'Hulu': 12.99,
            'Disney Plus': 7.99,
            'Adobe Creative': 52.99,
            'GitHub Pro': 4.99,
            '24 Hour Fitness': 39.99,
            'Planet Fitness': 10.00,
            'Yoga Studio': 89.00,
            'CrossFit Gym': 150.00
        }

        self.category_ranges = {
            'grocery': (30, 200),
            'restaurant': (8, 60),
            'subscription': (5, 100),
            'utilities': (50, 300),
            'transport': (10, 100),
            'shopping': (20, 500),
            'entertainment': (15, 150),
            'healthcare': (20, 500),
            'fitness': (10, 200)
        }

    def generate_transactions(self, num_days: int = 180, num_transactions: int = 500) -> List[Dict[str, Any]]:
        transactions = []
        start_date = datetime.now() - timedelta(days=num_days)

        for merchant, amount in self.subscription_amounts.items():
            category = self._get_category_for_merchant(merchant)
            num_charges = num_days // 30

            for i in range(num_charges):
                charge_date = start_date + timedelta(days=30 * i + random.randint(-2, 2))
                transactions.append({
                    'date': charge_date.isoformat(),
                    'amount': amount + random.uniform(-0.50, 0.50),
                    'merchant': merchant,
                    'category': category,
                    'description': f'{merchant} monthly subscription',
                    'transaction_type': 'expense'
                })

        regular_transactions = num_transactions - len(transactions)
        for _ in range(regular_transactions):
            category = random.choice(list(self.merchants.keys()))
            merchant = random.choice(self.merchants[category])
            min_amount, max_amount = self.category_ranges[category]

            is_anomaly = random.random() < 0.05
            if is_anomaly:
                amount = random.uniform(max_amount * 2, max_amount * 4)
            else:
                amount = random.uniform(min_amount, max_amount)

            transaction_date = start_date + timedelta(
                days=random.randint(0, num_days),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            transactions.append({
                'date': transaction_date.isoformat(),
                'amount': round(amount, 2),
                'merchant': merchant,
                'category': category,
                'description': f'Purchase at {merchant}',
                'transaction_type': 'expense'
            })

        income_dates = [start_date + timedelta(days=15 + 30*i) for i in range(num_days // 30)]
        for income_date in income_dates:
            transactions.append({
                'date': income_date.isoformat(),
                'amount': 5000.00 + random.uniform(-500, 500),
                'merchant': 'Employer Inc',
                'category': 'income',
                'description': 'Monthly salary',
                'transaction_type': 'income'
            })

        transactions.sort(key=lambda x: x['date'])
        return transactions

    def _get_category_for_merchant(self, merchant: str) -> str:
        for category, merchants in self.merchants.items():
            if merchant in merchants:
                return category
        return 'other'

    def save_to_csv(self, transactions: List[Dict[str, Any]], filename: str = 'sample_transactions.csv'):
        with open(filename, 'w', newline='') as csvfile:
            fieldnames = ['date', 'amount', 'merchant', 'category', 'description', 'transaction_type']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for transaction in transactions:
                writer.writerow(transaction)

        return filename

    def save_to_json(self, transactions: List[Dict[str, Any]], filename: str = 'sample_transactions.json'):
        with open(filename, 'w') as jsonfile:
            json.dump(transactions, jsonfile, indent=2)

        return filename

def generate_sample_data():
    generator = SyntheticDataGenerator()
    transactions = generator.generate_transactions(num_days=180, num_transactions=500)

    csv_file = generator.save_to_csv(transactions, 'backend/sample_transactions.csv')
    json_file = generator.save_to_json(transactions, 'backend/sample_transactions.json')

    print(f"Generated {len(transactions)} transactions")
    print(f"CSV file saved: {csv_file}")
    print(f"JSON file saved: {json_file}")

    return transactions

if __name__ == "__main__":
    generate_sample_data()