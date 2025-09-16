import { claims, uploadedFiles, users, type User, type InsertUser, type Claim, type InsertClaim, type UploadedFile, type InsertFile, type ClaimWithFiles, type DashboardStats } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sum } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Claims
  getClaim(id: string): Promise<ClaimWithFiles | undefined>;
  getClaimByClaimId(claimId: string): Promise<Claim | undefined>;
  getClaims(limit?: number): Promise<ClaimWithFiles[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: string, updates: Partial<InsertClaim>): Promise<Claim>;
  deleteClaim(id: string): Promise<boolean>;
  
  // Files
  getFile(id: string): Promise<UploadedFile | undefined>;
  getFilesByClaimId(claimId: string): Promise<UploadedFile[]>;
  createFile(file: InsertFile): Promise<UploadedFile>;
  updateFileStatus(id: string, status: "uploaded" | "processing" | "processed" | "failed"): Promise<UploadedFile>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Claims
  async getClaim(id: string): Promise<ClaimWithFiles | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    if (!claim) return undefined;
    
    const files = await db.select().from(uploadedFiles).where(eq(uploadedFiles.claimId, id));
    return { ...claim, files };
  }

  async getClaimByClaimId(claimId: string): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.claimId, claimId));
    return claim || undefined;
  }

  async getClaims(limit = 50): Promise<ClaimWithFiles[]> {
    const claimsList = await db
      .select()
      .from(claims)
      .orderBy(desc(claims.createdAt))
      .limit(limit);

    const claimsWithFiles = await Promise.all(
      claimsList.map(async (claim) => {
        const files = await db
          .select()
          .from(uploadedFiles)
          .where(eq(uploadedFiles.claimId, claim.id));
        return { ...claim, files };
      })
    );

    return claimsWithFiles;
  }

  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    const [claim] = await db
      .insert(claims)
      .values({
        ...insertClaim,
        updatedAt: new Date(),
      })
      .returning();
    return claim;
  }

  async updateClaim(id: string, updates: Partial<InsertClaim>): Promise<Claim> {
    const [claim] = await db
      .update(claims)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(claims.id, id))
      .returning();
    return claim;
  }

  async deleteClaim(id: string): Promise<boolean> {
    const result = await db.delete(claims).where(eq(claims.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Files
  async getFile(id: string): Promise<UploadedFile | undefined> {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id));
    return file || undefined;
  }

  async getFilesByClaimId(claimId: string): Promise<UploadedFile[]> {
    return await db.select().from(uploadedFiles).where(eq(uploadedFiles.claimId, claimId));
  }

  async createFile(insertFile: InsertFile): Promise<UploadedFile> {
    const [file] = await db
      .insert(uploadedFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  async updateFileStatus(id: string, status: "uploaded" | "processing" | "processed" | "failed"): Promise<UploadedFile> {
    const [file] = await db
      .update(uploadedFiles)
      .set({ status })
      .where(eq(uploadedFiles.id, id))
      .returning();
    return file;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalClaimsResult] = await db.select({ count: count() }).from(claims);
    const [processedResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(eq(claims.status, "approved"));
    const [totalAreaResult] = await db
      .select({ total: sum(claims.area) })
      .from(claims);
    const [pendingResult] = await db
      .select({ count: count() })
      .from(claims)
      .where(eq(claims.status, "pending"));

    return {
      totalClaims: totalClaimsResult.count,
      processed: processedResult.count,
      totalArea: Number(totalAreaResult.total) || 0,
      pending: pendingResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
