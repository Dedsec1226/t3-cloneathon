import { useState, useEffect } from 'react';

export interface UserPreferences {
  name: string;
  occupation: string;
  mainFont: string;
  codeFont: string;
}

const defaultPreferences: UserPreferences = {
  name: '',
  occupation: '',
  mainFont: 'proxima',
  codeFont: 'berkeley',
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('t3-user-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Error parsing preferences:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    try {
      localStorage.setItem('t3-user-preferences', JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  };

  // Update specific preference
  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    return savePreferences({ [key]: value });
  };

  // Clear all preferences
  const clearPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('t3-user-preferences');
  };

  return {
    preferences,
    isLoaded,
    savePreferences,
    updatePreference,
    clearPreferences,
  };
} 