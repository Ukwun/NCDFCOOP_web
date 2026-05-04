"use client";

import { useGlobalSettings } from '@/lib/context/GlobalSettingsContext';
import { useState } from 'react';

export default function GlobalSettingsPage() {
  const { settings, loading, updateSettings } = useGlobalSettings();
  const [themeColor, setThemeColor] = useState(settings?.themeColor || '#2563eb');
  const [language, setLanguage] = useState(settings?.language || 'en');

  if (loading || !settings) {
    return <div className="max-w-2xl mx-auto mt-10 p-6 text-center text-gray-500">Loading settings...</div>;
  }

  // Handle theme color change
  const handleThemeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThemeColor(e.target.value);
    updateSettings({ themeColor: e.target.value });
  };

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    updateSettings({ language: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Global Website Settings</h1>

      {/* Theme Switcher */}
      <div className="mb-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={!!settings.darkMode}
            onChange={() => updateSettings({ darkMode: !settings.darkMode })}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="text-gray-800 dark:text-gray-200">Enable Dark Mode</span>
        </label>
      </div>

      {/* Theme Color Picker */}
      <div className="mb-6">
        <label className="block mb-2 text-gray-700 dark:text-gray-200 font-medium">Theme Color</label>
        <input
          type="color"
          value={themeColor}
          onChange={handleThemeColorChange}
          className="w-12 h-12 p-1 border-2 border-gray-300 rounded"
        />
        <span className="ml-4 text-gray-700 dark:text-gray-200">{themeColor}</span>
      </div>

      {/* In-App Notifications Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={!!settings.inAppNotifications}
            onChange={() => updateSettings({ inAppNotifications: !settings.inAppNotifications })}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="text-gray-800 dark:text-gray-200">Enable In-App Notifications</span>
        </label>
      </div>

      {/* Language Selector */}
      <div className="mb-6">
        <label className="block mb-2 text-gray-700 dark:text-gray-200 font-medium">Language</label>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="p-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="yo">Yoruba</option>
          <option value="ig">Igbo</option>
          <option value="ha">Hausa</option>
        </select>
      </div>

      <div className="mt-8 text-gray-500 text-sm">
        <p>All changes here affect the entire website in real time.</p>
      </div>
    </div>
  );
}
