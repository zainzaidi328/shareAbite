export const ROLES = ["DONOR", "RECIPIENT", "NGO", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const CATEGORIES = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Bakery",
  "Dairy",
  "Cooked Meal",
  "Fruit",
  "Vegetables",
  "Beverages",
  "Dessert",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const DONATION_STATUSES = [
  "ACTIVE",
  "RESERVED",
  "COMPLETED",
  "EXPIRED",
  "REMOVED",
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const REQUEST_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const AUTH_COOKIE = "sharebite_token";

/** Average people fed per donated serving — used by the impact calculator. */
export const MEALS_PER_SERVING = 1;
/** Estimated kg of food saved per serving. */
export const KG_PER_SERVING = 0.4;

export const DASHBOARD_HOME: Record<Role, string> = {
  DONOR: "/dashboard/donor",
  RECIPIENT: "/dashboard/browse",
  NGO: "/dashboard/ngo",
  ADMIN: "/admin",
};
