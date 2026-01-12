var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";
import Razorpay from "razorpay";
import bcrypt from "bcrypt";
import session from "express-session";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  blogPosts: () => blogPosts,
  contactSubmissions: () => contactSubmissions,
  insertBlogPostSchema: () => insertBlogPostSchema,
  insertContactSubmissionSchema: () => insertContactSubmissionSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertPricingPlanSchema: () => insertPricingPlanSchema,
  insertTestimonialSchema: () => insertTestimonialSchema,
  insertUserSchema: () => insertUserSchema,
  payments: () => payments,
  pricingPlans: () => pricingPlans,
  testimonials: () => testimonials,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  // "admin" or "user"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow()
});
var blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull(),
  image: text("image"),
  published: boolean("published").default(false),
  authorId: varchar("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull().default(5),
  image: text("image"),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var pricingPlans = pgTable("pricing_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull().default("Students"),
  // "Students", "Professional", "Graduate"
  price: integer("price").notNull(),
  // in paise/cents
  currency: text("currency").notNull().default("INR"),
  features: jsonb("features").notNull(),
  // array of features
  popular: boolean("popular").default(false),
  active: boolean("active").default(true),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow()
});
var contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  category: text("category").notNull(),
  message: text("message"),
  status: text("status").notNull().default("new"),
  // "new", "contacted", "closed"
  createdAt: timestamp("created_at").defaultNow()
});
var payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  planId: varchar("plan_id").references(() => pricingPlans.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull(),
  // "pending", "completed", "failed"
  customerDetails: jsonb("customer_details"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true
});
var insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true
});
var insertPricingPlanSchema = createInsertSchema(pricingPlans).omit({
  id: true,
  createdAt: true
});
var insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
  status: true
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUserStripeInfo(id, customerId, subscriptionId) {
    const [user] = await db.update(users).set({
      stripeCustomerId: customerId,
      ...subscriptionId && { stripeSubscriptionId: subscriptionId }
    }).where(eq(users.id, id)).returning();
    return user;
  }
  // Blog Posts
  async getAllBlogPosts(published) {
    const query = db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    if (published !== void 0) {
      return await query.where(eq(blogPosts.published, published));
    }
    return await query;
  }
  async getBlogPost(id) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || void 0;
  }
  async getBlogPostBySlug(slug) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || void 0;
  }
  async createBlogPost(post) {
    const [created] = await db.insert(blogPosts).values(post).returning();
    return created;
  }
  async updateBlogPost(id, post) {
    const [updated] = await db.update(blogPosts).set({ ...post, updatedAt: /* @__PURE__ */ new Date() }).where(eq(blogPosts.id, id)).returning();
    return updated;
  }
  async deleteBlogPost(id) {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }
  // Testimonials
  async getAllTestimonials(published) {
    const query = db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
    if (published !== void 0) {
      return await query.where(eq(testimonials.published, published));
    }
    return await query;
  }
  async createTestimonial(testimonial) {
    const [created] = await db.insert(testimonials).values(testimonial).returning();
    return created;
  }
  async updateTestimonial(id, testimonial) {
    const [updated] = await db.update(testimonials).set(testimonial).where(eq(testimonials.id, id)).returning();
    return updated;
  }
  async deleteTestimonial(id) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }
  // Pricing Plans
  async getAllPricingPlans(active) {
    const query = db.select().from(pricingPlans);
    if (active !== void 0) {
      return await query.where(eq(pricingPlans.active, active));
    }
    return await query;
  }
  async getPricingPlan(id) {
    const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, id));
    return plan || void 0;
  }
  async getPricingPlanBySlug(slug) {
    const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.slug, slug));
    return plan || void 0;
  }
  async createPricingPlan(plan) {
    const [created] = await db.insert(pricingPlans).values(plan).returning();
    return created;
  }
  async updatePricingPlan(id, plan) {
    const [updated] = await db.update(pricingPlans).set(plan).where(eq(pricingPlans.id, id)).returning();
    return updated;
  }
  async deletePricingPlan(id) {
    await db.delete(pricingPlans).where(eq(pricingPlans.id, id));
  }
  // Contact Submissions
  async getAllContactSubmissions() {
    return await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }
  async createContactSubmission(submission) {
    const [created] = await db.insert(contactSubmissions).values(submission).returning();
    return created;
  }
  async updateContactSubmissionStatus(id, status) {
    const [updated] = await db.update(contactSubmissions).set({ status }).where(eq(contactSubmissions.id, id)).returning();
    return updated;
  }
  // Payments
  async createPayment(payment) {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }
  async getPayment(id) {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || void 0;
  }
  async getPaymentByStripeId(stripePaymentIntentId) {
    const [payment] = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
    return payment || void 0;
  }
  async updatePaymentStatus(id, status) {
    const [updated] = await db.update(payments).set({ status }).where(eq(payments.id, id)).returning();
    return updated;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";
if (!process.env.RAZORPAY_KEY_ID) {
  throw new Error("Missing required environment variable: RAZORPAY_KEY_ID");
}
if (!process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Missing required environment variable: RAZORPAY_KEY_SECRET");
}
var razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
async function registerRoutes(app2) {
  app2.use(session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1e3 }
    // 24 hours
  }));
  const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };
  const requireAdmin = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await storage.getUser(req.session.userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = user;
    next();
  };
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (req.session) {
        req.session.userId = user.id;
      }
      res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "Login failed: " + error.message });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });
  app2.get("/api/blog", async (req, res) => {
    try {
      const publishedQuery = req.query.published;
      const published = publishedQuery === "true" ? true : publishedQuery === "false" ? false : void 0;
      const posts = await storage.getAllBlogPosts(published);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching blog posts: " + error.message });
    }
  });
  app2.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Error fetching blog post: " + error.message });
    }
  });
  app2.post("/api/blog", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost({ ...validatedData, authorId: req.user.id });
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Error creating blog post: " + error.message });
    }
  });
  app2.put("/api/blog/:id", requireAdmin, async (req, res) => {
    try {
      const post = await storage.updateBlogPost(req.params.id, req.body);
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: "Error updating blog post: " + error.message });
    }
  });
  app2.delete("/api/blog/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting blog post: " + error.message });
    }
  });
  app2.get("/api/testimonials", async (req, res) => {
    try {
      const published = req.query.published !== "false";
      const testimonials2 = await storage.getAllTestimonials(published);
      res.json(testimonials2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching testimonials: " + error.message });
    }
  });
  app2.post("/api/testimonials", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(validatedData);
      res.status(201).json(testimonial);
    } catch (error) {
      res.status(400).json({ message: "Error creating testimonial: " + error.message });
    }
  });
  app2.put("/api/testimonials/:id", requireAdmin, async (req, res) => {
    try {
      const testimonial = await storage.updateTestimonial(req.params.id, req.body);
      res.json(testimonial);
    } catch (error) {
      res.status(400).json({ message: "Error updating testimonial: " + error.message });
    }
  });
  app2.delete("/api/testimonials/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTestimonial(req.params.id);
      res.json({ message: "Testimonial deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting testimonial: " + error.message });
    }
  });
  app2.get("/api/pricing", async (req, res) => {
    try {
      const active = req.query.active !== "false";
      const plans = await storage.getAllPricingPlans(active);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pricing plans: " + error.message });
    }
  });
  app2.post("/api/pricing", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertPricingPlanSchema.parse(req.body);
      const plan = await storage.createPricingPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: "Error creating pricing plan: " + error.message });
    }
  });
  app2.put("/api/pricing/:id", requireAdmin, async (req, res) => {
    try {
      const plan = await storage.updatePricingPlan(req.params.id, req.body);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: "Error updating pricing plan: " + error.message });
    }
  });
  app2.delete("/api/pricing/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePricingPlan(req.params.id);
      res.json({ message: "Pricing plan deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting pricing plan: " + error.message });
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ message: "Error submitting contact form: " + error.message });
    }
  });
  app2.get("/api/contact", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getAllContactSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contact submissions: " + error.message });
    }
  });
  app2.put("/api/contact/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const submission = await storage.updateContactSubmissionStatus(req.params.id, status);
      res.json(submission);
    } catch (error) {
      res.status(400).json({ message: "Error updating contact submission: " + error.message });
    }
  });
  app2.post("/api/create-payment-order", async (req, res) => {
    try {
      const createPaymentSchema = z.object({
        planId: z.string().min(1, "Plan ID is required"),
        customerDetails: z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          phone: z.string().optional()
        })
      });
      const validatedData = createPaymentSchema.parse(req.body);
      const { planId, customerDetails } = validatedData;
      const plan = await storage.getPricingPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Pricing plan not found" });
      }
      const order = await razorpay.orders.create({
        amount: plan.price,
        currency: plan.currency,
        notes: {
          planId: plan.id,
          planName: plan.name
        }
      });
      await storage.createPayment({
        planId: plan.id,
        stripePaymentIntentId: order.id,
        // Using same field name but storing Razorpay order ID
        amount: plan.price,
        currency: plan.currency,
        status: "pending",
        customerDetails
      });
      res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
      res.status(500).json({ message: "Error creating payment order: " + error.message });
    }
  });
  app2.post("/api/verify-payment", async (req, res) => {
    try {
      const verifyPaymentSchema = z.object({
        razorpay_order_id: z.string().min(1, "Order ID is required"),
        razorpay_payment_id: z.string().min(1, "Payment ID is required"),
        razorpay_signature: z.string().min(1, "Signature is required")
      });
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifyPaymentSchema.parse(req.body);
      const crypto = __require("crypto");
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return res.status(500).json({ message: "Payment gateway not configured" });
      }
      const generated_signature = crypto.createHmac("sha256", keySecret).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }
      const payment = await storage.getPaymentByStripeId(razorpay_order_id);
      if (payment) {
        await storage.updatePaymentStatus(payment.id, "completed");
        res.json({ message: "Payment verified successfully", status: "completed" });
      } else {
        res.status(404).json({ message: "Payment record not found" });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Payment verification failed: " + error.message });
    }
  });
  app2.post("/api/razorpay-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.warn("RAZORPAY_WEBHOOK_SECRET not configured, webhook signature verification disabled");
        const { event: event2, payload: payload2 } = JSON.parse(req.body.toString());
        if (event2 === "payment.captured") {
          const orderId = payload2.payment.entity.order_id;
          try {
            const payment = await storage.getPaymentByStripeId(orderId);
            if (payment) {
              await storage.updatePaymentStatus(payment.id, "completed");
            }
          } catch (error) {
            console.error("Error updating payment status:", error);
          }
        }
        return res.json({ status: "ok", note: "processed without verification" });
      }
      const signature = req.headers["x-razorpay-signature"];
      if (!signature) {
        return res.status(400).json({ message: "No signature found" });
      }
      const crypto = __require("crypto");
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(req.body).digest("hex");
      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return res.status(400).json({ message: "Invalid signature" });
      }
      const { event, payload } = JSON.parse(req.body.toString());
      if (event === "payment.captured") {
        const orderId = payload.payment.entity.order_id;
        try {
          const payment = await storage.getPaymentByStripeId(orderId);
          if (payment) {
            await storage.updatePaymentStatus(payment.id, "completed");
          }
        } catch (error) {
          console.error("Error updating payment status:", error);
        }
      }
      res.json({ status: "ok" });
    } catch (error) {
      console.log("Webhook error:", error.message);
      res.status(400).json({ message: "Webhook error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  base: "./",
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
