import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { OCRResult, FileUploadState } from "@/types";

export function useFileUpload() {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    uploadProgress: 0,
    error: null,
  });
  
  const [ocrResult, setOCRResult] = useState<{ file: any; ocrResult: OCRResult } | null>(null);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File) => {
    setUploadState({
      isUploading: true,
      uploadProgress: 0,
      error: null,
    });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90),
        }));
      }, 200);

      const result = await api.uploadFile(file);
      
      clearInterval(progressInterval);
      
      setUploadState({
        isUploading: false,
        uploadProgress: 100,
        error: null,
      });

      setOCRResult(result);
      
      toast({
        title: "Upload Successful",
        description: `OCR processing completed with ${result.ocrResult.confidence}% confidence`,
      });

      return result;
    } catch (error) {
      setUploadState({
        isUploading: false,
        uploadProgress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
      });

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });

      throw error;
    }
  }, [toast]);

  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      uploadProgress: 0,
      error: null,
    });
    setOCRResult(null);
  }, []);

  return {
    uploadState,
    ocrResult,
    uploadFile,
    resetUpload,
  };
}
