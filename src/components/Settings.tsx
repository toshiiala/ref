import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Reminder {
  id?: number;
  intervalValue: number;
  intervalUnit: string;
  message: string;
  action: string;
}

const Settings = () => {
  const [allowInvites, setAllowInvites] = useState(false);
  const [requiredReferrals, setRequiredReferrals] = useState(1);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/settings');
        console.log('Settings response:', response.data);
        setAllowInvites(response.data.allowInvites);
        setRequiredReferrals(response.data.requiredReferrals);
        setReminders(response.data.reminders || []);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleToggleInvites = async () => {
    // Disabled for maintenance
  };

  const handleReferralChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Disabled for maintenance
  };

  const handleReminderChange = (index: number, field: keyof Reminder, value: string | number) => {
    // Disabled for maintenance
  };

  const handleAddReminder = () => {
    // Disabled for maintenance
  };

  const handleRemoveReminder = (index: number) => {
    // Disabled for maintenance
  };

  const handleSaveReminders = async () => {
    // Disabled for maintenance
  };

  const MaintenanceBanner = () => (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
      <p className="font-bold">Maintenance</p>
      <p>This feature is currently under maintenance. We apologize for any inconvenience.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Referral Settings</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your referral program settings here.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <MaintenanceBanner />
          <div className="space-y-6 opacity-50 pointer-events-none">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="allow-invites"
                  name="allow-invites"
                  type="checkbox"
                  checked={allowInvites}
                  onChange={handleToggleInvites}
                  disabled={true}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="allow-invites" className="font-medium text-gray-700">
                  Allow users to invite others in order to get the link of our app
                </label>
                <p className="text-gray-500">
                  Note: This may cause people to drop off because they need to invite {requiredReferrals} people to our app. Therefore, we set a maximum of 2 referrals.
                </p>
              </div>
            </div>
            {allowInvites && (
              <div>
                <label htmlFor="required-referrals" className="block text-sm font-medium text-gray-700">
                  Required Referrals
                </label>
                <input
                  type="number"
                  name="required-referrals"
                  id="required-referrals"
                  min="1"
                  max="2"
                  value={requiredReferrals}
                  onChange={handleReferralChange}
                  disabled={true}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Reminders</h3>
          <p className="mt-1 text-sm text-gray-500">
            Set up automated reminders for your users.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <MaintenanceBanner />
          <div className="space-y-6 opacity-50 pointer-events-none">
            {Array.isArray(reminders) && reminders.map((reminder, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={reminder.intervalValue}
                    onChange={(e) => handleReminderChange(index, 'intervalValue', parseInt(e.target.value))}
                    disabled={true}
                    className="mt-1 block w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <select
                    value={reminder.intervalUnit}
                    onChange={(e) => handleReminderChange(index, 'intervalUnit', e.target.value)}
                    disabled={true}
                    className="mt-1 block w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                  <select
                    value={reminder.action}
                    onChange={(e) => handleReminderChange(index, 'action', e.target.value)}
                    disabled={true}
                    className="mt-1 block w-40 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="no_action">Send to everyone</option>
                    <option value="not_invited">Not invited yet</option>
                    <option value="not_paid">Not paid</option>
                  </select>
                  <button
                    onClick={() => handleRemoveReminder(index)}
                    disabled={true}
                    className="mt-1 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={reminder.message}
                  onChange={(e) => handleReminderChange(index, 'message', e.target.value)}
                  disabled={true}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={3}
                  placeholder="Reminder message"
                />
              </div>
            ))}
            <button
              onClick={handleAddReminder}
              disabled={true}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Reminder
            </button>
            <button
              onClick={handleSaveReminders}
              disabled={true}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
