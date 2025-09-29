/**
 * User Preferences and Settings localStorage Utility
 *
 * This utility manages user-specific preferences and settings stored in localStorage.
 * All data is keyed by user email to ensure proper data isolation between users.
 */

export interface UserPlan {
  type: "free" | "basic" | "professional" | "enterprise";
  status: "active" | "expired" | "cancelled";
  startDate?: string;
  endDate?: string;
  features?: string[];
}

export interface UserPreferences {
  // Plan and subscription info
  plan: UserPlan;

  // Account metadata
  accountCreatedAt: string;
  lastLoginAt: string;
  loginCount: number;

  // User interface preferences
  theme: "light" | "dark" | "auto";
  sidebarCollapsed: boolean;
  defaultView: "bookshelf" | "write" | "manage";

  // Writing preferences
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  wordCountGoal?: number;
  preferredFontSize: number;
  preferredFontFamily: string;

  // Notification preferences
  showNotifications: boolean;
  showWordCountNotifications: boolean;
  showSaveNotifications: boolean;

  // Export preferences
  defaultExportFormat: "pdf" | "docx" | "txt" | "html";
  includeMetadataInExport: boolean;

  // Privacy and data preferences
  analyticsOptIn: boolean;
  shareUsageData: boolean;

  // Feature flags and beta access
  betaFeatures: string[];
  experimentalFeatures: string[];

  // Recent activity tracking
  recentBooks: string[]; // book IDs
  recentStories: string[]; // story IDs

  // Custom settings
  customSettings: Record<string, unknown>;
}

// Default preferences for new users
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  plan: {
    type: "free",
    status: "active",
    startDate: new Date().toISOString(),
    features: ["local-storage", "basic-writing", "export-txt"],
  },
  accountCreatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  loginCount: 1,
  theme: "auto",
  sidebarCollapsed: false,
  defaultView: "bookshelf",
  autoSave: true,
  autoSaveInterval: 30,
  preferredFontSize: 14,
  preferredFontFamily: "'Rubik', sans-serif",
  showNotifications: true,
  showWordCountNotifications: true,
  showSaveNotifications: true,
  defaultExportFormat: "pdf",
  includeMetadataInExport: true,
  analyticsOptIn: false,
  shareUsageData: false,
  betaFeatures: [],
  experimentalFeatures: [],
  recentBooks: [],
  recentStories: [],
  customSettings: {},
};

/**
 * Get the localStorage key for user preferences
 */
const getUserPreferencesKey = (userEmail: string): string => {
  return `twain-user-preferences-${userEmail}`;
};

/**
 * Load user preferences from localStorage
 */
export const loadUserPreferences = (userEmail?: string): UserPreferences => {
  if (typeof window === "undefined" || !userEmail) {
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const storageKey = getUserPreferencesKey(userEmail);
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      // First time user - create default preferences
      const newPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        accountCreatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
      };
      saveUserPreferences(newPreferences, userEmail);
      return newPreferences;
    }

    const preferences = JSON.parse(stored) as UserPreferences;

    // Merge with defaults to ensure all properties exist (for updates/migrations)
    const mergedPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      ...preferences,
      // Always update last login
      lastLoginAt: new Date().toISOString(),
      loginCount: (preferences.loginCount || 0) + 1,
    };

    // Save the updated preferences back
    saveUserPreferences(mergedPreferences, userEmail);

    return mergedPreferences;
  } catch (error) {
    console.error("Error loading user preferences:", error);
    return DEFAULT_USER_PREFERENCES;
  }
};

/**
 * Save user preferences to localStorage
 */
export const saveUserPreferences = (
  preferences: UserPreferences,
  userEmail?: string
): void => {
  if (typeof window === "undefined" || !userEmail) {
    return;
  }

  try {
    const storageKey = getUserPreferencesKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving user preferences:", error);
  }
};

/**
 * Update specific user preference
 */
export const updateUserPreference = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
  userEmail?: string
): void => {
  if (!userEmail) return;

  const currentPreferences = loadUserPreferences(userEmail);
  const updatedPreferences = {
    ...currentPreferences,
    [key]: value,
  };

  saveUserPreferences(updatedPreferences, userEmail);
};

/**
 * Update user plan information
 */
export const updateUserPlan = (
  planInfo: Partial<UserPlan>,
  userEmail?: string
): void => {
  if (!userEmail) return;

  const currentPreferences = loadUserPreferences(userEmail);
  const updatedPreferences = {
    ...currentPreferences,
    plan: {
      ...currentPreferences.plan,
      ...planInfo,
    },
  };

  saveUserPreferences(updatedPreferences, userEmail);
};

/**
 * Check if user has a specific feature based on their plan
 */
export const hasFeature = (feature: string, userEmail?: string): boolean => {
  if (!userEmail) return false;

  const preferences = loadUserPreferences(userEmail);
  return preferences.plan.features?.includes(feature) || false;
};

/**
 * Get user's current plan type
 */
export const getUserPlanType = (userEmail?: string): UserPlan["type"] => {
  if (!userEmail) return "free";

  const preferences = loadUserPreferences(userEmail);
  return preferences.plan.type;
};

/**
 * Check if user's plan is active
 */
export const isPlanActive = (userEmail?: string): boolean => {
  if (!userEmail) return false;

  const preferences = loadUserPreferences(userEmail);

  if (preferences.plan.status !== "active") {
    return false;
  }

  // Check if plan has expired
  if (preferences.plan.endDate) {
    const endDate = new Date(preferences.plan.endDate);
    const now = new Date();
    return now <= endDate;
  }

  return true;
};

/**
 * Add a book/story to recent activity
 */
export const addToRecentActivity = (
  type: "book" | "story",
  id: string,
  userEmail?: string
): void => {
  if (!userEmail) return;

  const preferences = loadUserPreferences(userEmail);
  const key = type === "book" ? "recentBooks" : "recentStories";
  const currentList = preferences[key] || [];

  // Remove existing entry if it exists
  const filteredList = currentList.filter((existingId) => existingId !== id);

  // Add to front of list and limit to 10 items
  const updatedList = [id, ...filteredList].slice(0, 10);

  updateUserPreference(key, updatedList, userEmail);
};

/**
 * Get account age in days
 */
export const getAccountAgeInDays = (userEmail?: string): number => {
  if (!userEmail) return 0;

  const preferences = loadUserPreferences(userEmail);
  const createdDate = new Date(preferences.accountCreatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Get last login information
 */
export const getLastLoginInfo = (
  userEmail?: string
): {
  lastLogin: string;
  loginCount: number;
  accountAge: number;
} => {
  if (!userEmail) {
    return {
      lastLogin: new Date().toISOString(),
      loginCount: 0,
      accountAge: 0,
    };
  }

  const preferences = loadUserPreferences(userEmail);

  return {
    lastLogin: preferences.lastLoginAt,
    loginCount: preferences.loginCount,
    accountAge: getAccountAgeInDays(userEmail),
  };
};

/**
 * Clear all user preferences (for account deletion)
 */
export const clearUserPreferences = (userEmail?: string): void => {
  if (typeof window === "undefined" || !userEmail) {
    return;
  }

  try {
    const storageKey = getUserPreferencesKey(userEmail);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Error clearing user preferences:", error);
  }
};

/**
 * Export user preferences for backup/migration
 */
export const exportUserPreferences = (userEmail?: string): string | null => {
  if (!userEmail) return null;

  try {
    const preferences = loadUserPreferences(userEmail);
    return JSON.stringify(preferences, null, 2);
  } catch (error) {
    console.error("Error exporting user preferences:", error);
    return null;
  }
};

/**
 * Import user preferences from backup
 */
export const importUserPreferences = (
  preferencesJson: string,
  userEmail?: string
): boolean => {
  if (!userEmail) return false;

  try {
    const preferences = JSON.parse(preferencesJson) as UserPreferences;

    // Validate the structure (basic check)
    if (!preferences.plan || !preferences.accountCreatedAt) {
      throw new Error("Invalid preferences format");
    }

    saveUserPreferences(preferences, userEmail);
    return true;
  } catch (error) {
    console.error("Error importing user preferences:", error);
    return false;
  }
};

/**
 * Feature flags and experimental features
 */
export const enableBetaFeature = (
  feature: string,
  userEmail?: string
): void => {
  if (!userEmail) return;

  const preferences = loadUserPreferences(userEmail);
  const updatedFeatures = Array.from(
    new Set([...preferences.betaFeatures, feature])
  );

  updateUserPreference("betaFeatures", updatedFeatures, userEmail);
};

export const disableBetaFeature = (
  feature: string,
  userEmail?: string
): void => {
  if (!userEmail) return;

  const preferences = loadUserPreferences(userEmail);
  const updatedFeatures = preferences.betaFeatures.filter((f) => f !== feature);

  updateUserPreference("betaFeatures", updatedFeatures, userEmail);
};

export const isBetaFeatureEnabled = (
  feature: string,
  userEmail?: string
): boolean => {
  if (!userEmail) return false;

  const preferences = loadUserPreferences(userEmail);
  return preferences.betaFeatures.includes(feature);
};
