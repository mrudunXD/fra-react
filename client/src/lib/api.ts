import { apiRequest } from "@/lib/queryClient";
import type { 
  DashboardStats, 
  Claim, 
  ClaimWithFiles, 
  OCRResult, 
  InsertClaim 
} from "@shared/schema";

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiRequest("GET", "/api/dashboard/stats");
    return response.json();
  },

  // File upload
  uploadFile: async (file: File): Promise<{ file: any; ocrResult: OCRResult }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }

    return response.json();
  },

  // Claims
  getClaims: async (limit?: number): Promise<ClaimWithFiles[]> => {
    const url = limit ? `/api/claims?limit=${limit}` : "/api/claims";
    const response = await apiRequest("GET", url);
    return response.json();
  },

  getClaim: async (id: string): Promise<ClaimWithFiles> => {
    const response = await apiRequest("GET", `/api/claims/${id}`);
    return response.json();
  },

  createClaim: async (claim: InsertClaim): Promise<Claim> => {
    const response = await apiRequest("POST", "/api/claims", claim);
    return response.json();
  },

  updateClaim: async (id: string, updates: Partial<InsertClaim>): Promise<Claim> => {
    const response = await apiRequest("PATCH", `/api/claims/${id}`, updates);
    return response.json();
  },

  deleteClaim: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/claims/${id}`);
  },

  // Map data
  getMapClaims: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/map/claims");
    return response.json();
  },

  saveClaimBoundary: async (claimId: string, geometry: any): Promise<Claim> => {
    const response = await apiRequest("POST", `/api/claims/${claimId}/boundary`, { geometry });
    return response.json();
  },

  // OCR
  saveOCRData: async (ocrData: any): Promise<Claim> => {
    const response = await apiRequest("POST", "/api/ocr/save", ocrData);
    return response.json();
  },
};
