import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "REQUEST_RECEIVED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "PICKUP_REMINDER"
  | "DONATION_COMPLETED"
  | "NGO_APPROVED"
  | "NEW_MESSAGE";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  await prisma.notification.create({
    data: { userId, type, title, body, link },
  });
}
