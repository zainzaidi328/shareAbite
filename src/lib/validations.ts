import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(7, "Enter a valid phone number")
      .max(20)
      .regex(/^[+\d][\d\s-]+$/, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["DONOR", "RECIPIENT", "NGO"]),
    address: z.string().min(5, "Enter your address"),
    city: z.string().min(2, "Enter your city"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    organizationName: z.string().optional(),
    registrationNo: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.role !== "NGO" || (d.organizationName && d.registrationNo), {
    message: "Organization name and registration number are required for NGOs",
    path: ["organizationName"],
  });

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const donationSchema = z
  .object({
    title: z.string().min(3, "Give the food a name").max(100),
    description: z.string().min(10, "Describe the food (10+ characters)").max(2000),
    category: z.enum(CATEGORIES),
    quantity: z.coerce.number().int().min(1, "At least 1").max(10000),
    servingSize: z.string().min(1, "e.g. 'Feeds 4 people'").max(100),
    cookedAt: z.string().optional(),
    expiresAt: z.string().min(1, "Expiry time is required"),
    pickupStart: z.string().min(1, "Pickup window start is required"),
    pickupEnd: z.string().min(1, "Pickup window end is required"),
    address: z.string().min(5, "Pickup address is required"),
    city: z.string().min(2, "City is required"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    imageUrl: z.string().url().optional().or(z.literal("")),
    instructions: z.string().max(1000).optional(),
    isVegetarian: z.boolean().optional(),
    isHalal: z.boolean().optional(),
  })
  .refine((d) => new Date(d.expiresAt) > new Date(), {
    message: "Expiry must be in the future",
    path: ["expiresAt"],
  })
  .refine((d) => new Date(d.pickupEnd) > new Date(d.pickupStart), {
    message: "Pickup window must end after it starts",
    path: ["pickupEnd"],
  });

export const requestSchema = z.object({
  donationId: z.string().min(1),
  message: z.string().max(500).optional(),
});

export const messageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  body: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  donationId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  address: z.string().min(5),
  city: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  bio: z.string().max(500).optional(),
  foodPrefs: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type DonationInput = z.infer<typeof donationSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
