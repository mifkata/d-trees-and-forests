'use client';

import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
}

export function Tabs({ tabs, defaultTab, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children(activeTab)}
    </div>
  );
}

interface ControlledTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function ControlledTabs({ tabs, activeTab, onTabChange, children, rightContent }: ControlledTabsProps) {
  return (
    <div>
      <div className="flex items-center border-b border-gray-200 mb-4">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {rightContent && (
          <div className="ml-auto">
            {rightContent}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
