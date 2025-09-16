import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertClaimSchema, insertFileSchema } from "@shared/schema";
import { ocrService } from "./services/ocrService";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create file record
      const fileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        status: "uploaded" as const,
        claimId: null, // Will be linked after OCR processing
        userId: null, // Add user authentication later
      };

      const insertFileData = insertFileSchema.parse(fileData);
      const uploadedFile = await storage.createFile(insertFileData);

      // Process file with OCR
      await storage.updateFileStatus(uploadedFile.id, "processing");

      try {
        const ocrResult = await ocrService.processFile(req.file.path, req.file.mimetype);
        await storage.updateFileStatus(uploadedFile.id, "processed");

        res.json({
          file: uploadedFile,
          ocrResult,
        });
      } catch (ocrError) {
        console.error("OCR processing failed:", ocrError);
        await storage.updateFileStatus(uploadedFile.id, "failed");
        res.status(500).json({ message: "OCR processing failed", file: uploadedFile });
      }
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Claims CRUD endpoints
  app.get("/api/claims", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const claims = await storage.getClaims(limit);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  app.post("/api/claims", async (req, res) => {
    try {
      const claimData = insertClaimSchema.parse(req.body);
      const claim = await storage.createClaim(claimData);
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(400).json({ message: "Failed to create claim" });
    }
  });

  app.patch("/api/claims/:id", async (req, res) => {
    try {
      const updates = insertClaimSchema.partial().parse(req.body);
      const claim = await storage.updateClaim(req.params.id, updates);
      res.json(claim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(400).json({ message: "Failed to update claim" });
    }
  });

  app.delete("/api/claims/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClaim(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Claim not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting claim:", error);
      res.status(500).json({ message: "Failed to delete claim" });
    }
  });

  // Map data endpoint - returns GeoJSON
  app.get("/api/map/claims", async (req, res) => {
    try {
      const claims = await storage.getClaims();
      
      // Filter claims that have boundary geometry
      const claimsWithGeometry = claims.filter(claim => claim.boundaryGeometry);
      
      // Convert to GeoJSON FeatureCollection
      const geojson = {
        type: "FeatureCollection",
        features: claimsWithGeometry.map(claim => ({
          type: "Feature",
          properties: {
            id: claim.id,
            claimId: claim.claimId,
            claimantName: claim.claimantName,
            village: claim.village,
            district: claim.district,
            state: claim.state,
            area: claim.area,
            status: claim.status,
            ocrConfidence: claim.ocrConfidence,
          },
          geometry: claim.boundaryGeometry,
        })),
      };

      res.json(geojson);
    } catch (error) {
      console.error("Error fetching map data:", error);
      res.status(500).json({ message: "Failed to fetch map data" });
    }
  });

  // Save polygon boundary for a claim
  app.post("/api/claims/:id/boundary", async (req, res) => {
    try {
      const { geometry } = req.body;
      
      if (!geometry) {
        return res.status(400).json({ message: "Geometry is required" });
      }

      const claim = await storage.updateClaim(req.params.id, {
        boundaryGeometry: geometry,
      });

      res.json(claim);
    } catch (error) {
      console.error("Error saving boundary:", error);
      res.status(400).json({ message: "Failed to save boundary" });
    }
  });

  // Process OCR corrections and create claim
  app.post("/api/ocr/save", async (req, res) => {
    try {
      const ocrData = req.body;
      
      // Validate required fields
      if (!ocrData.claimantName || !ocrData.village || !ocrData.claimId || !ocrData.area) {
        return res.status(400).json({ message: "Missing required claim data" });
      }

      // Check if claim ID already exists
      const existingClaim = await storage.getClaimByClaimId(ocrData.claimId);
      if (existingClaim) {
        return res.status(400).json({ message: "Claim ID already exists" });
      }

      const claimData = {
        claimId: ocrData.claimId,
        claimantName: ocrData.claimantName,
        village: ocrData.village,
        district: ocrData.district || null,
        state: ocrData.state || null,
        area: ocrData.area,
        surveyNumber: ocrData.surveyNumber || null,
        status: "pending" as const,
        ocrConfidence: ocrData.confidence || null,
        boundaryGeometry: null,
        rawOcrText: ocrData.rawText || null,
        userId: null, // Add user authentication later
      };

      const claim = await storage.createClaim(claimData);

      // Link file to claim if fileId provided
      if (ocrData.fileId) {
        // Update the uploaded file to link it to this claim
        await storage.updateFileStatus(ocrData.fileId, "processed");
      }

      res.status(201).json(claim);
    } catch (error) {
      console.error("Error saving OCR data:", error);
      res.status(400).json({ message: "Failed to save claim data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
