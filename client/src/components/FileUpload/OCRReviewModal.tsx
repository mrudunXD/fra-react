import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { X, Save, AlertTriangle } from "lucide-react";
import type { OCRResult } from "@/types";

interface OCRReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocrData: { file: any; ocrResult: OCRResult } | null;
}

export function OCRReviewModal({ isOpen, onClose, ocrData }: OCRReviewModalProps) {
  const [formData, setFormData] = useState({
    claimantName: "",
    village: "",
    claimId: "",
    area: "",
    surveyNumber: "",
    district: "",
    state: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form data when OCR data changes
  useEffect(() => {
    if (ocrData?.ocrResult) {
      const result = ocrData.ocrResult;
      setFormData({
        claimantName: result.claimantName || "",
        village: result.village || "",
        claimId: result.claimId || "",
        area: result.area || "",
        surveyNumber: result.surveyNumber || "",
        district: result.district || "",
        state: result.state || "",
      });
    }
  }, [ocrData]);

  const saveOCRMutation = useMutation({
    mutationFn: api.saveOCRData,
    onSuccess: () => {
      toast({
        title: "Claim Created Successfully",
        description: "OCR data has been reviewed and saved as a new claim.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save claim data",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!ocrData) return;

    // Validate required fields
    if (!formData.claimantName || !formData.village || !formData.claimId || !formData.area) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields: Claimant Name, Village, Claim ID, and Area.",
        variant: "destructive",
      });
      return;
    }

    const saveData = {
      ...formData,
      confidence: ocrData.ocrResult.confidence,
      rawText: ocrData.ocrResult.rawText,
      fileId: ocrData.file.id,
    };

    saveOCRMutation.mutate(saveData);
  }, [formData, ocrData, saveOCRMutation, toast]);

  const handleReject = useCallback(() => {
    toast({
      title: "OCR Data Rejected",
      description: "The extracted data has been rejected and will not be saved.",
    });
    onClose();
  }, [onClose, toast]);

  if (!isOpen || !ocrData) return null;

  const { ocrResult } = ocrData;
  const confidenceColor = 
    ocrResult.confidence >= 80 
      ? "bg-accent/10 text-accent" 
      : ocrResult.confidence >= 60 
      ? "bg-chart-1/10 text-chart-1" 
      : "bg-destructive/10 text-destructive";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">
              OCR Text Review
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Document */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">
              Original Document
            </h4>
            <div className="bg-muted rounded-lg p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Document preview not available
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Original file: {ocrData.file.originalName}
                </p>
              </div>
            </div>
          </div>

          {/* Extracted Text */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground">
                Extracted Text
              </h4>
              <Badge className={confidenceColor} data-testid="confidence-badge">
                Confidence: {ocrResult.confidence}%
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="claimantName" className="text-xs font-medium text-muted-foreground">
                  Claimant Name *
                </Label>
                <Input
                  id="claimantName"
                  value={formData.claimantName}
                  onChange={(e) => handleInputChange("claimantName", e.target.value)}
                  className="mt-1"
                  data-testid="input-claimant-name"
                />
              </div>
              
              <div>
                <Label htmlFor="village" className="text-xs font-medium text-muted-foreground">
                  Village *
                </Label>
                <Input
                  id="village"
                  value={formData.village}
                  onChange={(e) => handleInputChange("village", e.target.value)}
                  className="mt-1"
                  data-testid="input-village"
                />
              </div>
              
              <div>
                <Label htmlFor="claimId" className="text-xs font-medium text-muted-foreground">
                  Claim ID *
                </Label>
                <Input
                  id="claimId"
                  value={formData.claimId}
                  onChange={(e) => handleInputChange("claimId", e.target.value)}
                  className="mt-1"
                  data-testid="input-claim-id"
                />
              </div>
              
              <div>
                <Label htmlFor="area" className="text-xs font-medium text-muted-foreground">
                  Area (Hectares) *
                </Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  className="mt-1"
                  data-testid="input-area"
                />
              </div>
              
              <div>
                <Label htmlFor="surveyNumber" className="text-xs font-medium text-muted-foreground">
                  Survey Number
                </Label>
                <Input
                  id="surveyNumber"
                  value={formData.surveyNumber}
                  onChange={(e) => handleInputChange("surveyNumber", e.target.value)}
                  className="mt-1"
                  data-testid="input-survey-number"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="district" className="text-xs font-medium text-muted-foreground">
                    District
                  </Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange("district", e.target.value)}
                    className="mt-1"
                    data-testid="input-district"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state" className="text-xs font-medium text-muted-foreground">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="mt-1"
                    data-testid="input-state"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Raw OCR Output */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Raw OCR Text
          </h4>
          <Textarea
            value={ocrResult.rawText}
            readOnly
            className="h-32 font-mono text-xs resize-none"
            data-testid="textarea-raw-ocr"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            data-testid="button-reject"
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveOCRMutation.isPending}
            data-testid="button-save"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveOCRMutation.isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
