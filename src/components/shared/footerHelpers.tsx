import React from "react";
import Footer from "./Footer";

export interface FooterVariant {
  containerClassName?: string;
  hrClassName?: string;
  textClassName?: string;
}

// Predefined footer variants for different component types
export const footerVariants = {
  // For homepage with gradient background
  homepage: {
    containerClassName: "pt-8 pb-16 px-8",
    hrClassName: "hidden",
    textClassName: "text-center text-white text-sm",
  },

  // For components with white background (like editors, forms)
  component: {
    containerClassName:
      "mt-auto border-t border-gray-200 bg-gray-50 pt-8 py-4 px-6",
    hrClassName: "hidden",
    textClassName: "text-center text-gray-600 text-xs",
  },

  // For components with existing layout structure
  integrated: {
    containerClassName: "border-t border-gray-200 pt-8 pb-16 py-6 px-6",
    hrClassName: "hidden",
    textClassName: "text-center text-gray-500 text-xs",
  },

  // Custom variant that can be overridden
  custom: {
    containerClassName: "pt-8 py-4 px-6",
    hrClassName: "hidden",
    textClassName: "text-center text-gray-600 text-sm",
  },
};

// Helper function to render footer with specific variant
export const renderFooter = (
  variant: keyof typeof footerVariants = "component",
  customProps?: Partial<FooterVariant>
) => {
  const variantProps = footerVariants[variant];
  const finalProps = customProps
    ? { ...variantProps, ...customProps }
    : variantProps;

  return <Footer {...finalProps} />;
};

// Hook for getting footer props (useful for inline usage)
export const useFooterProps = (
  variant: keyof typeof footerVariants = "component",
  customProps?: Partial<FooterVariant>
) => {
  const variantProps = footerVariants[variant];
  return customProps ? { ...variantProps, ...customProps } : variantProps;
};

export default Footer;
