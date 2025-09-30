export interface PricingPlan {
  name: string;
  price: {
    amount: number;
    currency: string;
    period: string;
  };
  features: string[];
  limitations: {
    outlines: number | "unlimited";
    stories: number | "unlimited";
    books: number | "unlimited";
    storyCollections: number | "unlimited";
    bookSeries?: number | "unlimited";
    storage: "local" | "cloud";
  };
  popular?: boolean;
}

export interface PricingPlans {
  plans: {
    freelance: PricingPlan;
    professional: PricingPlan;
  };
}

export const twainPricingPlans: PricingPlans = {
  plans: {
    freelance: {
      name: "Freelance",
      price: {
        amount: 0,
        currency: "USD",
        period: "forever",
      },
      features: [
        "3 Outlines and 3 Stories",
        "3 Books or 3 Story Collections",
        "Local storage only",
        "Export to Word® as DOCx",
      ],
      limitations: {
        outlines: 3,
        stories: 3,
        books: 3,
        storyCollections: 3,
        storage: "local",
      },
    },
    professional: {
      name: "Professional",
      price: {
        amount: 45,
        currency: "USD",
        period: "year",
      },
      features: [
        "Unlimited Ideas, Characters, Outlines, Stories, Chapters and Parts",
        "Unlimited books and story collections",
        "Unlimited book series",
        "Cloud storage",
        "Export to Word® as DOCx",
        "Import Word® files",
        "Publish Book to Amazon Kindle (coming soon)",
      ],
      limitations: {
        outlines: "unlimited",
        stories: "unlimited",
        books: "unlimited",
        storyCollections: "unlimited",
        bookSeries: "unlimited",
        storage: "cloud",
      },
      popular: true,
    },
  },
};
