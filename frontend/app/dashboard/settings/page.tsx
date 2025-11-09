'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { User, Bell, Shield, CreditCard, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ paddingLeft: 'clamp(4rem, 10vw, 10rem)', paddingRight: 'clamp(4rem, 10vw, 10rem)', paddingTop: '32px', paddingBottom: '32px' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 className="text-3xl font-bold text-[#2C1810]">Settings</h1>
            <p className="text-[#2C1810]/70 mt-2">Manage your account preferences</p>
          </div>

          <div className="flex gap-2 border-b border-gray-200 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'text-[#E97451] border-[#E97451]'
                      : 'text-[#2C1810]/60 border-transparent hover:text-[#2C1810]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[#2C1810] mb-4">Profile Information</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-900">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name || ''}
                      className="border border-gray-300 px-3 py-2 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-900">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      className="border border-gray-300 px-3 py-2 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-900">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="border border-gray-300 px-3 py-2 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                      placeholder="Enter your phone"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-900">
                      Time Zone
                    </label>
                    <select className="border border-gray-300 px-3 py-2 text-sm text-[#2C1810] focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]">
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Pacific Time (PT)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-900">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    className="border border-gray-300 px-3 py-2 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-[#E97451] hover:text-[#A0522D] flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[#2C1810] mb-4">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    { label: 'Email notifications for transactions', defaultChecked: true },
                    { label: 'Weekly spending summary', defaultChecked: true },
                    { label: 'Goal achievement alerts', defaultChecked: true },
                    { label: 'Subscription renewal reminders', defaultChecked: false },
                    { label: 'Anomaly detection alerts', defaultChecked: true },
                    { label: 'Marketing and promotional emails', defaultChecked: false },
                  ].map((item, index) => (
                    <label key={index} className="flex items-center justify-between bg-white border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer" style={{ padding: '24px' }}>
                      <span className="text-[#2C1810]">{item.label}</span>
                      <input
                        type="checkbox"
                        defaultChecked={item.defaultChecked}
                        className="w-5 h-5 text-[#E97451] focus:ring-[#E97451]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[#2C1810] mb-4">Security Settings</h2>

                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition" style={{ padding: '32px' }}>
                    <h3 className="font-semibold text-[#2C1810] mb-2">Change Password</h3>
                    <p className="text-[#2C1810]/70 text-sm mb-4">Update your password regularly to keep your account secure</p>
                    <button className="px-4 py-2 text-sm font-medium text-[#E97451] hover:text-[#A0522D]">
                      Change Password
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition" style={{ padding: '32px' }}>
                    <h3 className="font-semibold text-[#2C1810] mb-2">Two-Factor Authentication</h3>
                    <p className="text-[#2C1810]/70 text-sm mb-4">Add an extra layer of security to your account</p>
                    <button className="px-4 py-2 text-sm font-medium text-[#E97451] hover:text-[#A0522D]">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[#2C1810] mb-4">Billing Information</h2>

                <div className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition" style={{ padding: '32px' }}>
                  <h3 className="text-lg font-semibold text-[#2C1810] mb-2">Current Plan: Free Trial</h3>
                  <p className="text-[#2C1810]/70 mb-4">You have 14 days remaining in your free trial</p>
                  <button className="px-4 py-2 text-sm font-medium text-[#E97451] hover:text-[#A0522D]">
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}