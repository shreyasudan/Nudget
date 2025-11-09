'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { alertService, Alert } from '@/lib/api';
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Bell,
  CheckCircle,
  XCircle,
  DollarSign,
  Info,
  RotateCw
} from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const response = await alertService.getAll(filter === 'unread', 50);
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertIds: string[]) => {
    try {
      await alertService.markAsRead(alertIds);
      await fetchAlerts();
      setSelectedAlerts([]);
    } catch (error) {
      console.error('Failed to mark alerts as read:', error);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      await alertService.generateAlerts();
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to generate alerts:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'GOAL_PROGRESS':
        return <Target className="w-5 h-5" />;
      case 'BUDGET_WARNING':
        return <AlertTriangle className="w-5 h-5" />;
      case 'ANOMALY':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'GOAL_PROGRESS':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'BUDGET_WARNING':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'ANOMALY':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E97451]"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-8 py-8" style={{ paddingLeft: '60px', paddingRight: '32px', paddingTop: '32px', paddingBottom: '32px' }}>
          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: '28px' }}>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`
                  : 'All alerts have been read'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Filter Buttons */}
              <div className="flex gap-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-6 py-2.5 text-sm rounded transition-colors ${
                    filter === 'all'
                      ? 'bg-[#E97451] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Alerts
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-6 py-2.5 text-sm rounded transition-colors ${
                    filter === 'unread'
                      ? 'bg-[#E97451] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unread Only
                </button>
              </div>

              {/* Actions */}
              {selectedAlerts.length > 0 && (
                <button
                  onClick={() => handleMarkAsRead(selectedAlerts)}
                  className="px-6 py-2.5 bg-[#2C1810] text-white rounded-md hover:bg-[#2C1810]/90 transition-colors text-sm font-medium"
                >
                  Mark {selectedAlerts.length} as Read
                </button>
              )}

              <button
                onClick={handleGenerateAlerts}
                className="flex items-center gap-2 text-[#E97451] hover:text-[#A0522D] transition-colors text-sm font-medium"
              >
                <RotateCw className="w-4 h-4" />
                Refresh Alerts
              </button>
            </div>
          </div>

          {/* Alerts List */}
          {alerts.length > 0 ? (
            <div className="flex flex-col gap-6" style={{ marginTop: '0' }}>
              {alerts.map((alert) => {
                const isSelected = selectedAlerts.includes(alert.id);
                const alertColorClass = getAlertColor(alert.type);

                return (
                  <div
                    key={alert.id}
                    className={`
                      rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition
                      ${isSelected ? 'ring-2 ring-[#E97451]' : ''}
                    `}
                    style={{ padding: '32px' }}
                    onClick={() => {
                      if (selectedAlerts.includes(alert.id)) {
                        setSelectedAlerts(selectedAlerts.filter(id => id !== alert.id));
                      } else {
                        setSelectedAlerts([...selectedAlerts, alert.id]);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg flex-shrink-0 ${alertColorClass}`}>
                        {getAlertIcon(alert.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {alert.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {alert.description}
                            </p>

                            {/* Metadata Pills */}
                            {alert.metadata && (
                              <div className="flex flex-wrap gap-2">
                                {alert.metadata.goal_name && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                                    <Target className="w-3 h-3" />
                                    {alert.metadata.goal_name}
                                  </span>
                                )}
                                {alert.metadata.category && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                    <Info className="w-3 h-3" />
                                    {alert.metadata.category}
                                  </span>
                                )}
                                {alert.metadata.progress_percentage !== undefined && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                                    <TrendingUp className="w-3 h-3" />
                                    {Math.round(alert.metadata.progress_percentage)}% complete
                                  </span>
                                )}
                                {alert.metadata.percent_used !== undefined && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
                                    <DollarSign className="w-3 h-3" />
                                    {Math.round(alert.metadata.percent_used)}% of budget
                                  </span>
                                )}
                                {alert.metadata.overspend_amount !== undefined && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
                                    <XCircle className="w-3 h-3" />
                                    ${alert.metadata.overspend_amount.toFixed(2)} over
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Timestamp and Read Status */}
                          <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                            <span>{formatDate(alert.created_at)}</span>
                            {!alert.is_read && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#E97451]/10 text-[#E97451]">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex gap-4 text-sm" style={{ marginTop: '24px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead([alert.id]);
                            }}
                            className="text-gray-600 hover:underline"
                          >
                            Mark as read
                          </button>
                          <label className="text-gray-600 hover:underline cursor-pointer flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedAlerts([...selectedAlerts, alert.id]);
                                } else {
                                  setSelectedAlerts(selectedAlerts.filter(id => id !== alert.id));
                                }
                              }}
                              className="w-4 h-4 text-[#E97451] bg-white border-gray-300 rounded focus:ring-[#E97451]"
                              style={{ marginRight: '12px' }}
                            />
                            Select
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16" style={{ marginTop: '0' }}>
              <div className="text-center max-w-md">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {filter === 'unread' ? 'No unread alerts' : 'No alerts yet'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {filter === 'unread'
                    ? 'All your alerts have been read'
                    : 'Alerts will appear here when there are important updates about your finances'
                  }
                </p>
                {filter === 'unread' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="text-[#E97451] hover:underline text-sm font-medium"
                  >
                    View all alerts
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}