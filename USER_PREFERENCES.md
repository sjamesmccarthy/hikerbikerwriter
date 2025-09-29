# User Preferences and Plan Management System

This system provides comprehensive localStorage-based user preferences and plan management for the Twain Story Builder application.

## Files Created

### 1. `/src/lib/userPreferences.ts`

Core utility functions for managing user preferences in localStorage with user isolation.

### 2. `/src/hooks/useUserPreferences.ts`

React hook for easy integration with components, providing automatic re-rendering when preferences change.

## Key Features

### User Preferences Management

- **Plan Status**: Track user's current plan (free, professional)
- **Account Metadata**: Creation date, last login, login count
- **UI Preferences**: Theme, sidebar state, default view
- **Writing Preferences**: Auto-save settings, word count goals, font preferences
- **Feature Flags**: Beta features, experimental features

### Plan Management

- **Dynamic Plan Display**: Shows current plan status in the UI
- **Feature Checking**: Conditionally enable/disable features based on plan
- **Plan Upgrades**: Handle plan upgrades with feature updates
- **Plan Expiration**: Check if paid plans have expired

### Data Isolation

- All data is stored with user email as a key suffix
- Prevents data mixing between different users
- Automatic cleanup when users log out

## Usage Examples

### Basic Usage in Components

```tsx
import { useUserPreferences } from "../hooks/useUserPreferences";

const MyComponent = () => {
  const {
    preferences,
    planType,
    isActivePlan,
    updatePreference,
    checkFeature,
  } = useUserPreferences();

  return (
    <div>
      <h2>Welcome {planType} user!</h2>
      {checkFeature("cloud-storage") && <button>Upload to Cloud</button>}
      {planType === "free" && (
        <button onClick={() => showUpgradeModal()}>Upgrade Plan</button>
      )}
    </div>
  );
};
```

### Plan Upgrade Handling

```tsx
const handleUpgradePlan = (newPlanType: "professional") => {
  updatePlan({
    type: newPlanType,
    status: "active",
    startDate: new Date().toISOString(),
    endDate: getPlanEndDate(newPlanType),
    features: getPlanFeatures(newPlanType),
  });

  showNotification(`Successfully upgraded to ${newPlanType} plan!`);
};
```

### Feature Checking

```tsx
// Check if user has specific features
const canExportPDF = checkFeature("export-pdf");
const hasCloudStorage = checkFeature("cloud-storage");
const canCollaborate = checkFeature("collaboration");

// Conditionally render UI based on features
{
  canExportPDF && <ExportPDFButton />;
}
{
  hasCloudStorage && <CloudSyncStatus />;
}
{
  canCollaborate && <ShareBookButton />;
}
```

## Plan Types and Features

### Free Plan

- ✓ Local storage
- ✓ Basic writing tools

### Freelance Free Plan

- ✓ Text export
- ✓ Up to 1 book
- ✗ Cloud storage
- ✗ Advanced exports

### Professional Plan ($45/year)

- ✓ All Freelance Free features
- ✓ Unlimited books
- ✓ Import DOCX files
- ✓ Premium templates and themes
- ✓ Publish to Amazon Kindle, ePub, and PDF
- ✓ Advanced collaboration tools
- ✓ Priority customer support
- ✓ Admin dashboard

## Data Structure

### UserPreferences Interface

```typescript
interface UserPreferences {
  // Plan and subscription info
  plan: UserPlan;

  // Account metadata
  accountCreatedAt: string;
  lastLoginAt: string;
  loginCount: number;

  // UI preferences
  theme: "light" | "dark" | "auto";
  sidebarCollapsed: boolean;
  defaultView: "bookshelf" | "write" | "manage";

  // Writing preferences
  autoSave: boolean;
  autoSaveInterval: number;
  wordCountGoal?: number;

  // Feature flags
  betaFeatures: string[];
  experimentalFeatures: string[];

  // Recent activity
  recentBooks: string[];
  recentStories: string[];
}
```

## Integration with Existing Components

The system has been integrated into `TwainStoryBuilder.tsx` with the following updates:

1. **Dynamic Plan Display**: The footer now shows the actual user's plan status
2. **Account Settings**: Shows account creation date, login count, and last login
3. **Feature List**: Displays which features are available based on the user's plan
4. **Plan Upgrade Buttons**: Functional upgrade buttons in the pricing modal

## localStorage Keys

All data is stored with user-specific keys:

- `twain-user-preferences-${userEmail}`: Main preferences object
- Existing keys continue to work: `twain-story-builder-books-${userEmail}`, etc.

## Error Handling

- Graceful fallback to default preferences if localStorage fails
- Automatic migration when preference structure changes
- Console error logging for debugging

## Future Enhancements

1. **Cloud Sync**: Sync preferences to a backend database for cross-device access
2. **Plan Billing Integration**: Connect with Stripe or similar payment processor
3. **Team Management**: Add team/organization-level preferences
4. **Advanced Analytics**: Track feature usage and user behavior
5. **A/B Testing**: Built-in support for feature flag-based A/B testing

## Testing

To test the system:

1. Log in with different users to verify data isolation
2. Try upgrading plans and check feature availability
3. Clear localStorage and verify default preferences are created
4. Check account age and login count tracking

The preferences will persist across browser sessions and provide a foundation for future cloud-based user management.
