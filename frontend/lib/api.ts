import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  description?: string;
  transaction_type: 'income' | 'expense';
  is_recurring: boolean;
  is_anomaly: boolean;
  anomaly_score: number;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  description?: string;
  is_active: boolean;
  progress_percentage: number;
  days_remaining: number;
}

export interface RecurringCharge {
  id: number;
  merchant: string;
  average_amount: number;
  frequency_days: number;
  last_charge_date: string;
  next_expected_date: string;
  category: string;
  is_active: boolean;
  confidence_score: number;
}

export interface SpendingOverview {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  categories: Record<string, number>;
  current_month_categories?: Record<string, number>;
  monthly_trend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export const transactionService = {
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/transactions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getAll(skip = 0, limit = 100) {
    return api.get<Transaction[]>('/api/transactions', {
      params: { skip, limit },
    });
  },

  async getOverview() {
    return api.get<SpendingOverview>('/api/transactions/overview');
  },

  async create(transaction: Omit<Transaction, 'id' | 'is_recurring' | 'is_anomaly' | 'anomaly_score'>) {
    return api.post<Transaction>('/api/transactions', transaction);
  },
};

export const subscriptionService = {
  async detect() {
    return api.post('/api/subscriptions/detect');
  },

  async getAll() {
    return api.get<RecurringCharge[]>('/api/subscriptions');
  },

  async getGrayCharges() {
    return api.get('/api/subscriptions/gray-charges');
  },
};

export const anomalyService = {
  async detect(useML = false) {
    return api.post('/api/anomalies/detect', null, {
      params: { use_ml: useML },
    });
  },

  async getSummary() {
    return api.get('/api/anomalies/summary');
  },
};

export const goalService = {
  async create(goal: Omit<Goal, 'id' | 'current_amount' | 'is_active' | 'progress_percentage' | 'days_remaining'>) {
    return api.post<Goal>('/api/goals/', goal);
  },

  async getAll(activeOnly = true) {
    return api.get<Goal[]>('/api/goals/', {
      params: { active_only: activeOnly },
    });
  },

  async update(id: number, updates: Partial<Goal>) {
    return api.put<Goal>(`/api/goals/${id}`, updates);
  },

  async delete(id: number) {
    return api.delete(`/api/goals/${id}`);
  },

  async updateProgress(id: number, amount: number) {
    return api.post(`/api/goals/${id}/progress`, null, {
      params: { amount },
    });
  },

  async getProjection(id: number) {
    return api.get(`/api/goals/${id}/projection`);
  },
};

export interface Budget {
  id: string;
  user_id: string;
  category?: string;
  amount_monthly: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetUsage {
  budget_id: string;
  category?: string;
  budgeted_amount: number;
  spent_amount: number;
  percent_used: number;
  remaining_amount: number;
  status?: string;
  currency?: string;
}

export const budgetService = {
  async create(budget: Omit<Budget, 'id' | 'user_id' | 'is_active' | 'created_at' | 'updated_at'>) {
    return api.post<Budget>('/api/budgets/', budget);
  },

  async getAll(activeOnly = true) {
    return api.get<Budget[]>('/api/budgets/', {
      params: { active_only: activeOnly },
    });
  },

  async getUsage(month?: string) {
    return api.get<BudgetUsage[]>('/api/budgets/usage', {
      params: { month },
    });
  },

  async update(id: string, updates: Partial<Budget>) {
    return api.put<Budget>(`/api/budgets/${id}`, updates);
  },

  async delete(id: string) {
    return api.delete(`/api/budgets/${id}`);
  },
};

export interface Alert {
  id: string;
  user_id: string;
  type: 'GOAL_PROGRESS' | 'BUDGET_WARNING' | 'ANOMALY' | 'SUMMARY' | 'SUBSCRIPTION_REMINDER' | 'GRAY_CHARGE';
  title: string;
  description: string;
  is_read: boolean;
  metadata?: {
    goal_id?: number;
    goal_name?: string;
    budget_id?: string;
    category?: string;
    current_amount?: number;
    target_amount?: number;
    budgeted_amount?: number;
    spent_amount?: number;
    overspend_amount?: number;
    progress_percentage?: number;
    percent_used?: number;
    percent_of_usual?: number;
  };
  created_at: string;
}

export const alertService = {
  async getAll(unreadOnly = false, limit = 20) {
    return api.get<Alert[]>('/api/alerts/', {
      params: { unread_only: unreadOnly, limit }
    });
  },

  async markAsRead(ids: string[]) {
    return api.post('/api/alerts/mark-read', { ids });
  },

  async generateAlerts() {
    return api.post('/api/alerts/generate');
  }
};