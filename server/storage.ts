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
      claimsList.map(async (claim: Claim) => {
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

// In-memory fallback storage for environments without a configured database
class MemoryStorage implements IStorage {
  private users: User[] = [];
  private claimsData: ClaimWithFiles[] = [];
  private filesData: UploadedFile[] = [];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }
  async createUser(user: InsertUser): Promise<User> {
    const created: User = { id: crypto.randomUUID(), createdAt: new Date(), ...user } as any;
    this.users.push(created);
    return created;
  }

  async getClaim(id: string): Promise<ClaimWithFiles | undefined> {
    return this.claimsData.find(c => c.id === id);
  }
  async getClaimByClaimId(claimId: string): Promise<Claim | undefined> {
    return this.claimsData.find(c => c.claimId === claimId) as any;
  }
  async getClaims(limit = 50): Promise<ClaimWithFiles[]> {
    return this.claimsData.slice(0, limit);
  }
  async createClaim(claim: InsertClaim): Promise<Claim> {
    const created: any = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      ...claim,
    };
    this.claimsData.unshift({ ...created, files: [] });
    return created;
  }
  async updateClaim(id: string, updates: Partial<InsertClaim>): Promise<Claim> {
    const idx = this.claimsData.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Claim not found');
    const current = this.claimsData[idx];
    const updated: any = { ...current, ...updates, updatedAt: new Date() };
    this.claimsData[idx] = { ...updated, files: current.files };
    return updated;
  }
  async deleteClaim(id: string): Promise<boolean> {
    const before = this.claimsData.length;
    this.claimsData = this.claimsData.filter(c => c.id !== id);
    this.filesData = this.filesData.filter(f => f.claimId !== id);
    return this.claimsData.length < before;
  }

  async getFile(id: string): Promise<UploadedFile | undefined> {
    return this.filesData.find(f => f.id === id);
  }
  async getFilesByClaimId(claimId: string): Promise<UploadedFile[]> {
    return this.filesData.filter(f => f.claimId === claimId);
  }
  async createFile(file: InsertFile): Promise<UploadedFile> {
    const created: UploadedFile = { id: crypto.randomUUID(), createdAt: new Date(), ...file } as any;
    this.filesData.push(created);
    return created;
  }
  async updateFileStatus(id: string, status: "uploaded" | "processing" | "processed" | "failed"): Promise<UploadedFile> {
    const file = this.filesData.find(f => f.id === id);
    if (!file) throw new Error('File not found');
    (file as any).status = status;
    return file;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const totalClaims = this.claimsData.length as any;
    const processed = this.claimsData.filter(c => c.status === 'approved').length as any;
    const totalArea = this.claimsData.reduce((acc, c) => acc + (Number(c.area) || 0), 0);
    const pending = this.claimsData.filter(c => c.status === 'pending').length as any;
    return { totalClaims, processed, totalArea, pending } as any;
  }
}

const usingDb = !!process.env.DATABASE_URL;
export const storage: IStorage = usingDb ? new DatabaseStorage() : new MemoryStorage();
