export * from "@shared/schema";
import type { OCRResult } from "@shared/schema";

// Frontend-specific types
export interface FileUploadState {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export interface MapState {
  center: [number, number];
  zoom: number;
  selectedLayer: 'openstreetmap' | 'satellite' | 'hybrid';
}

export interface DrawingState {
  isDrawing: boolean;
  currentTool: 'polygon' | 'rectangle' | null;
  drawnShapes: any[];
}

export interface OCRModalState {
  isOpen: boolean;
  fileId: string | null;
  ocrResult: OCRResult | null;
  isLoading: boolean;
}

export interface FilterState {
  state: string | null;
  district: string | null;
  village: string | null;
  status: string | null;
}
