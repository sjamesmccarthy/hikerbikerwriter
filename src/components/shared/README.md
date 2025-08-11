# Footer Component Usage Guide

This guide explains how to use the reusable footer component and helper functions across your application.

## Quick Start

### 1. Import the helper

```tsx
import { renderFooter } from "./shared/footerHelpers";
```

### 2. Add footer to your component

```tsx
return (
  <div>
    {/* Your component content */}

    {/* Footer */}
    {renderFooter("integrated")}
  </div>
);
```

## Available Variants

### `homepage`

For components with gradient backgrounds (like the homepage):

- White text on transparent background
- No horizontal rule
- 32px top padding, larger bottom padding

### `component`

For components with white backgrounds:

- Gray text on light gray background
- Top border instead of horizontal rule
- 32px top padding, automatically positioned at bottom

### `integrated`

For components with existing layout structures:

- Smaller, subtle styling
- 32px top padding, minimal other spacing
- Works well within flex layouts

### `custom`

Base variant that can be customized:

```tsx
{
  renderFooter("custom", {
    textClassName: "text-center text-blue-600 text-lg",
    containerClassName: "pt-8 py-8 px-4 bg-blue-50",
  });
}
```

## Alternative Usage Methods

### Using the Footer component directly

```tsx
import Footer from "./shared/Footer";

<Footer
  containerClassName="pt-8 py-4 px-6"
  hrClassName="hidden"
  textClassName="text-center text-gray-600 text-sm"
/>;
```

### Using the hook for inline props

```tsx
import { useFooterProps } from "./shared/footerHelpers";

const footerProps = useFooterProps("component");
return <Footer {...footerProps} />;
```

## Customization

You can easily modify the footer content by editing `/src/components/shared/Footer.tsx`. All components using the footer will automatically get the updates.

The footer variants can be customized in `/src/components/shared/footerHelpers.tsx`.
