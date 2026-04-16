import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Activity {
  id: string;
  message: string;
  messageHi: string;
  timestamp: Date;
  icon: string;
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (message: string, messageHi: string, icon: string) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  const addActivity = useCallback((message: string, messageHi: string, icon: string) => {
    setActivities((prev) => [
      { id: crypto.randomUUID(), message, messageHi, timestamp: new Date(), icon },
      ...prev.slice(0, 19),
    ]);
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, addActivity }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('useActivity must be used within ActivityProvider');
  return context;
}
