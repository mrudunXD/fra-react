import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { OCRReviewModal } from "./OCRReviewModal";
import { CloudUpload, FolderOpen, FileText, Image, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const { uploadState, ocrResult, uploadFile, resetUpload } = useFileUpload();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      const result = await uploadFile(file);
      if (result) {
        setShowOCRModal(true);
      }
    }
  }, [uploadFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadFile(file);
      if (result) {
        setShowOCRModal(true);
      }
    }
  }, [uploadFile]);

  const handleOCRModalClose = useCallback(() => {
    setShowOCRModal(false);
    resetUpload();
  }, [resetUpload]);

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary hover:bg-primary/5",
              uploadState.isUploading && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="file-drop-zone"
          >
            <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">
              Drop files here
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploadState.isUploading}
            />
            
            <Button
              asChild
              disabled={uploadState.isUploading}
              data-testid="button-select-files"
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                <FolderOpen className="mr-2 h-4 w-4" />
                Select Files
              </label>
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              Supports PDF, JPG, PNG up to 10MB
            </p>
            
            {uploadState.isUploading && (
              <div className="mt-6">
                <Progress value={uploadState.uploadProgress} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Processing... {uploadState.uploadProgress}%
                </p>
              </div>
            )}
            
            {uploadState.error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {uploadState.error}
              </div>
            )}
          </div>

          {/* Recent Uploads */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Recent Uploads
            </h4>
            <div className="space-y-2">
              {/* Sample recent uploads - in real app this would come from API */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-destructive mr-3" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      claim_doc_001.pdf
                    </p>
                    <p className="text-xs text-muted-foreground">
                      2.3 MB • Processed
                    </p>
                  </div>
                </div>
                <span className="text-xs text-accent font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  OCR Complete
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center">
                  <Image className="h-5 w-5 text-chart-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      survey_map_042.jpg
                    </p>
                    <p className="text-xs text-muted-foreground">
                      5.1 MB • Processing
                    </p>
                  </div>
                </div>
                <span className="text-xs text-chart-1 font-medium flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  In Queue
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <OCRReviewModal
        isOpen={showOCRModal}
        onClose={handleOCRModalClose}
        ocrData={ocrResult}
      />
    </div>
  );
}
