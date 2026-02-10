import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, shows, type User, type InsertUser, type Show, type InsertShow } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return buf.toString("hex") === hashed;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(supplied: string, stored: string): Promise<boolean>;

  getShows(userId: string): Promise<Show[]>;
  getShow(id: string): Promise<Show | undefined>;
  createShow(show: InsertShow & { userId: string }): Promise<Show>;
  updateShow(id: string, show: Partial<InsertShow>): Promise<Show | undefined>;
  deleteShow(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(insertUser.password);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async verifyPassword(supplied: string, stored: string): Promise<boolean> {
    return comparePassword(supplied, stored);
  }

  async getShows(userId: string): Promise<Show[]> {
    return db.select().from(shows).where(eq(shows.userId, userId));
  }

  async getShow(id: string): Promise<Show | undefined> {
    const [show] = await db.select().from(shows).where(eq(shows.id, id));
    return show;
  }

  async createShow(show: InsertShow & { userId: string }): Promise<Show> {
    const [created] = await db.insert(shows).values(show).returning();
    return created;
  }

  async updateShow(id: string, data: Partial<InsertShow>): Promise<Show | undefined> {
    const [updated] = await db.update(shows).set(data).where(eq(shows.id, id)).returning();
    return updated;
  }

  async deleteShow(id: string): Promise<boolean> {
    const result = await db.delete(shows).where(eq(shows.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
