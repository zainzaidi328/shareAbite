import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seed locations are centered on Lahore, Pakistan.
const CENTER = { lat: 31.5204, lng: 74.3587 };
const jitter = (n: number) => n + (Math.random() - 0.5) * 0.08;

const FOOD_IMAGES: Record<string, string> = {
  "Cooked Meal": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
  Bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  Fruit: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80",
  Vegetables: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
  Dairy: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80",
  Vegetarian: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  Halal: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80",
  Dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
  Beverages: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
  Vegan: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80",
  Other: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
};

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);

async function main() {
  console.log("🌱 Seeding ShareBite...");

  await prisma.$transaction([
    prisma.authToken.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.review.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.donationRequest.deleteMany(),
    prisma.foodDonation.deleteMany(),
    prisma.ngoProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const password = await bcrypt.hash("Password123!", 10);
  const base = {
    passwordHash: password,
    emailVerified: true,
    city: "Lahore",
  };

  const admin = await prisma.user.create({
    data: {
      ...base,
      fullName: "ShareBite Admin",
      email: "admin@sharebite.app",
      phone: "+92 300 0000000",
      role: "ADMIN",
      address: "ShareBite HQ, Gulberg III",
      latitude: CENTER.lat,
      longitude: CENTER.lng,
    },
  });

  const donorData = [
    { fullName: "Ayesha Khan", email: "donor@sharebite.app", address: "12-B Model Town" },
    { fullName: "Bilal's Bakery", email: "bakery@sharebite.app", address: "45 Liberty Market, Gulberg" },
    { fullName: "Spice Route Restaurant", email: "restaurant@sharebite.app", address: "MM Alam Road" },
    { fullName: "Hamza Farooq", email: "hamza@sharebite.app", address: "78 DHA Phase 5" },
  ];
  const donors = [];
  for (const d of donorData) {
    donors.push(
      await prisma.user.create({
        data: {
          ...base,
          ...d,
          phone: "+92 301 1234567",
          role: "DONOR",
          latitude: jitter(CENTER.lat),
          longitude: jitter(CENTER.lng),
          bio: "Sharing surplus food so nothing goes to waste.",
        },
      })
    );
  }

  const recipientData = [
    { fullName: "Sana Malik", email: "recipient@sharebite.app", address: "Street 4, Ichhra" },
    { fullName: "Usman Ali", email: "usman@sharebite.app", address: "Krishan Nagar" },
    { fullName: "Fatima Noor", email: "fatima@sharebite.app", address: "Samanabad" },
  ];
  const recipients = [];
  for (const r of recipientData) {
    recipients.push(
      await prisma.user.create({
        data: {
          ...base,
          ...r,
          phone: "+92 302 7654321",
          role: "RECIPIENT",
          latitude: jitter(CENTER.lat),
          longitude: jitter(CENTER.lng),
          foodPrefs: "Halal,Vegetarian",
        },
      })
    );
  }

  const ngoUser = await prisma.user.create({
    data: {
      ...base,
      fullName: "Rizq Foundation",
      email: "ngo@sharebite.app",
      phone: "+92 303 1112223",
      role: "NGO",
      address: "Office 3, Johar Town",
      latitude: jitter(CENTER.lat),
      longitude: jitter(CENTER.lng),
      ngoProfile: {
        create: {
          organizationName: "Rizq Foundation",
          registrationNo: "NGO-2019-4521",
          description: "Rescuing surplus food and delivering it to communities in need across Lahore.",
          approved: true,
          volunteers: 34,
        },
      },
    },
  });

  const pendingNgo = await prisma.user.create({
    data: {
      ...base,
      fullName: "Food Angels",
      email: "ngo2@sharebite.app",
      phone: "+92 304 5556667",
      role: "NGO",
      address: "Shadman Colony",
      latitude: jitter(CENTER.lat),
      longitude: jitter(CENTER.lng),
      ngoProfile: {
        create: {
          organizationName: "Food Angels",
          registrationNo: "NGO-2024-1177",
          description: "New volunteer-run food rescue group.",
          approved: false,
          volunteers: 8,
        },
      },
    },
  });

  const donationSpecs = [
    { title: "Chicken Biryani (Freshly Cooked)", category: "Cooked Meal", quantity: 25, servingSize: "Feeds 25 people", isHalal: true, donor: donors[2], desc: "Freshly cooked chicken biryani from today's lunch service. Packed in food-grade containers, kept warm." },
    { title: "Assorted Bread & Pastries", category: "Bakery", quantity: 40, servingSize: "40 pieces", isVegetarian: true, donor: donors[1], desc: "End-of-day bread loaves, croissants and pastries. Baked fresh this morning." },
    { title: "Vegetable Curry & Rice", category: "Vegetarian", quantity: 15, servingSize: "Feeds 15 people", isVegetarian: true, isHalal: true, donor: donors[0], desc: "Homemade mixed vegetable curry with steamed rice. Mildly spiced, family recipe." },
    { title: "Fresh Seasonal Fruit Box", category: "Fruit", quantity: 10, servingSize: "10 kg mixed", isVegetarian: true, donor: donors[3], desc: "Mangoes, bananas and apples from our weekly shop — more than we can finish." },
    { title: "Daal Chawal (Large Pot)", category: "Cooked Meal", quantity: 30, servingSize: "Feeds 30 people", isVegetarian: true, isHalal: true, donor: donors[2], desc: "Big pot of daal with rice, cooked for an event that ended early." },
    { title: "Fresh Milk & Yogurt", category: "Dairy", quantity: 12, servingSize: "12 packs", isVegetarian: true, donor: donors[0], desc: "Sealed milk packs and yogurt tubs, refrigerated, one week before expiry." },
    { title: "Vegetable Crate (Restaurant Surplus)", category: "Vegetables", quantity: 20, servingSize: "20 kg crate", isVegetarian: true, donor: donors[2], desc: "Tomatoes, onions, potatoes and greens — surplus from this week's delivery." },
    { title: "Gulab Jamun & Kheer", category: "Dessert", quantity: 18, servingSize: "18 portions", isVegetarian: true, donor: donors[1], desc: "Leftover dessert portions from a wedding order, refrigerated overnight." },
  ] as const;

  const donations = [];
  for (const [i, s] of donationSpecs.entries()) {
    donations.push(
      await prisma.foodDonation.create({
        data: {
          donorId: s.donor.id,
          title: s.title,
          description: s.desc,
          category: s.category,
          quantity: s.quantity,
          servingSize: s.servingSize,
          cookedAt: s.category === "Cooked Meal" ? hoursFromNow(-3) : undefined,
          expiresAt: hoursFromNow(6 + i * 6),
          pickupStart: hoursFromNow(1),
          pickupEnd: hoursFromNow(8),
          address: s.donor.address,
          city: "Lahore",
          latitude: jitter(CENTER.lat),
          longitude: jitter(CENTER.lng),
          imageUrl: FOOD_IMAGES[s.category],
          instructions: "Please bring your own bags/containers if possible. Ring the bell at the gate.",
          isVegetarian: "isVegetarian" in s ? !!s.isVegetarian : false,
          isHalal: "isHalal" in s ? !!s.isHalal : false,
          status: "ACTIVE",
        },
      })
    );
  }

  // Completed history for stats/reviews/impact.
  const completedDonation = await prisma.foodDonation.create({
    data: {
      donorId: donors[0].id,
      title: "Chana Pulao (Completed)",
      description: "Chickpea rice, picked up yesterday.",
      category: "Cooked Meal",
      quantity: 20,
      servingSize: "Feeds 20 people",
      expiresAt: hoursFromNow(-20),
      pickupStart: hoursFromNow(-26),
      pickupEnd: hoursFromNow(-20),
      address: donors[0].address,
      city: "Lahore",
      latitude: jitter(CENTER.lat),
      longitude: jitter(CENTER.lng),
      imageUrl: FOOD_IMAGES["Cooked Meal"],
      status: "COMPLETED",
      isHalal: true,
    },
  });

  await prisma.donationRequest.create({
    data: {
      donationId: completedDonation.id,
      requesterId: recipients[0].id,
      status: "COMPLETED",
      pickupCode: "482913",
      message: "Assalam o Alaikum, I can pick this up for my family and neighbours.",
      completedAt: hoursFromNow(-22),
    },
  });

  // A pending request on an active donation, so the donor dashboard has action items.
  await prisma.donationRequest.create({
    data: {
      donationId: donations[0].id,
      requesterId: recipients[1].id,
      status: "PENDING",
      message: "I work with a shelter nearby — this would feed everyone tonight.",
    },
  });

  await prisma.notification.create({
    data: {
      userId: donations[0].donorId,
      type: "REQUEST_RECEIVED",
      title: "New pickup request",
      body: `Usman Ali requested "${donations[0].title}"`,
      link: "/dashboard/requests",
    },
  });

  await prisma.review.create({
    data: {
      donationId: completedDonation.id,
      authorId: recipients[0].id,
      targetId: donors[0].id,
      rating: 5,
      comment: "The food was fresh and Ayesha was so kind. Thank you!",
    },
  });

  await prisma.favorite.create({
    data: { userId: recipients[0].id, donorId: donors[0].id },
  });

  const conv = await prisma.conversation.create({
    data: { userAId: donors[0].id, userBId: recipients[0].id },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conv.id, senderId: recipients[0].id, body: "Hi! Is the pickup address near the main market?", createdAt: hoursFromNow(-25) },
      { conversationId: conv.id, senderId: donors[0].id, body: "Yes, two streets behind it. I'll share the gate photo.", createdAt: hoursFromNow(-24.8), readAt: hoursFromNow(-24) },
      { conversationId: conv.id, senderId: recipients[0].id, body: "Perfect, see you at 6pm. JazakAllah!", createdAt: hoursFromNow(-24.5) },
    ],
  });

  console.log("✅ Seed complete.");
  console.log("   Admin:     admin@sharebite.app / Password123!");
  console.log("   Donor:     donor@sharebite.app / Password123!");
  console.log("   Recipient: recipient@sharebite.app / Password123!");
  console.log("   NGO:       ngo@sharebite.app / Password123!");
  void admin; void ngoUser; void pendingNgo;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
