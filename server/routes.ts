import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { insertShowSchema } from "@shared/schema";
import { seedDatabase } from "./seed";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "drum-circle-pk-secret-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  // Push schema & seed
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { db } = await import("./db");
  const schema = await import("@shared/schema");
  const { sql } = await import("drizzle-orm");

  // Create enums and tables
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE show_type AS ENUM ('Corporate', 'Private', 'Public', 'University');
  EXCEPTION WHEN duplicate_object THEN null; END $$`);

  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE show_status AS ENUM ('upcoming', 'completed', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN null; END $$`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'founder'
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS shows (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      city TEXT NOT NULL,
      show_type show_type NOT NULL,
      organization_name TEXT,
      total_amount INTEGER NOT NULL,
      advance_payment INTEGER NOT NULL DEFAULT 0,
      show_date TIMESTAMP NOT NULL,
      status show_status NOT NULL DEFAULT 'upcoming',
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      user_id VARCHAR NOT NULL
    )
  `);

  await seedDatabase();

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await storage.verifyPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // Shows CRUD
  app.get("/api/shows", requireAuth, async (req, res) => {
    const shows = await storage.getShows(req.session.userId!);
    res.json(shows);
  });

  app.get("/api/shows/:id", requireAuth, async (req, res) => {
    const show = await storage.getShow(req.params.id);
    if (!show || show.userId !== req.session.userId) {
      return res.status(404).json({ message: "Show not found" });
    }
    res.json(show);
  });

  app.post("/api/shows", requireAuth, async (req, res) => {
    try {
      const parsed = insertShowSchema.parse(req.body);
      const show = await storage.createShow({
        ...parsed,
        userId: req.session.userId!,
      });
      res.status(201).json(show);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid show data" });
    }
  });

  app.patch("/api/shows/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getShow(req.params.id);
      if (!existing || existing.userId !== req.session.userId) {
        return res.status(404).json({ message: "Show not found" });
      }
      const parsed = insertShowSchema.partial().parse(req.body);
      const updated = await storage.updateShow(req.params.id, parsed);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Update failed" });
    }
  });

  app.delete("/api/shows/:id", requireAuth, async (req, res) => {
    const existing = await storage.getShow(req.params.id);
    if (!existing || existing.userId !== req.session.userId) {
      return res.status(404).json({ message: "Show not found" });
    }
    await storage.deleteShow(req.params.id);
    res.json({ message: "Deleted" });
  });

  return httpServer;
}
