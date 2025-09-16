import fs from "fs";
import path from "path";
import type { OCRResult } from "@shared/schema";

/**
 * Mock OCR Service
 * 
 * In a real implementation, this would integrate with:
 * - EasyOCR for printed text
 * - TrOCR for handwritten text
 * - spaCy for NLP entity recognition
 * 
 * For this MVP, we simulate OCR processing with realistic results.
 */
class OCRService {
  private mockResults: OCRResult[] = [
    {
      claimantName: "Ramesh Kumar",
      village: "Kachargaon",
      claimId: "FRA-2024-001",
      area: "2.45",
      surveyNumber: "123/2A",
      district: "Gadchiroli",
      state: "Maharashtra",
      rawText: `FOREST RIGHTS ACT CLAIM FORM
Claimant: Ramesh Kumar
Village: Kachargaon
District: Gadchiroli
State: Maharashtra
Claim ID: FRA-2024-001
Area: 2.45 hectares
Survey No: 123/2A
Date: 15-03-2024`,
      confidence: 94
    },
    {
      claimantName: "Sita Devi",
      village: "Bamni",
      claimId: "FRA-2024-002",
      area: "1.87",
      surveyNumber: "87/1B",
      district: "Gadchiroli",
      state: "Maharashtra",
      rawText: `फॉरेस्ट राइट्स एक्ट क्लेम फॉर्म
दावेदार: सीता देवी
गाव: बामनी
जिल्हा: गडचिरोली
राज्य: महाराष्ट्र
क्लेम आयडी: FRA-2024-002
क्षेत्र: 1.87 हेक्टर
सर्वे नं: 87/1B`,
      confidence: 67
    },
    {
      claimantName: "Mohan Singh",
      village: "Mendha",
      claimId: "FRA-2024-003",
      area: "3.12",
      district: "Gadchiroli",
      state: "Maharashtra",
      rawText: `FOREST RIGHTS CLAIM
Name: Mohan Singh
Village: Mendha
Area: 3.12 hectares
[Handwritten text - partially illegible]
Survey: [unclear]
Date: [smudged]`,
      confidence: 23
    }
  ];

  /**
   * Process uploaded file and extract structured data
   */
  async processFile(filePath: string, mimeType: string): Promise<OCRResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found for OCR processing");
    }

    // Get file stats for processing simulation
    const fileStats = fs.statSync(filePath);
    const fileSizeKB = fileStats.size / 1024;

    // Simulate different confidence based on file type and size
    let baseConfidence = 85;
    
    if (mimeType === 'application/pdf') {
      baseConfidence = 90; // PDFs typically have better OCR results
    } else if (mimeType.startsWith('image/')) {
      baseConfidence = 75; // Images might have lower quality
    }

    // Adjust confidence based on file size (larger files might have better resolution)
    if (fileSizeKB > 1000) {
      baseConfidence += 5;
    } else if (fileSizeKB < 100) {
      baseConfidence -= 10;
    }

    // Add some randomness to simulate real-world variability
    const finalConfidence = Math.max(15, Math.min(98, 
      baseConfidence + (Math.random() * 20 - 10)
    ));

    // Select a mock result and adjust confidence
    const mockResult = this.mockResults[Math.floor(Math.random() * this.mockResults.length)];
    
    // Generate unique claim ID for each processing
    const timestamp = Date.now().toString().slice(-4);
    const uniqueClaimId = `FRA-2024-${timestamp}`;

    const result: OCRResult = {
      ...mockResult,
      claimId: uniqueClaimId,
      confidence: Math.round(finalConfidence)
    };

    // Simulate different quality results based on confidence
    if (result.confidence < 50) {
      // Low confidence - introduce some errors or missing fields
      result.district = result.district ? "[UNCLEAR]" : undefined;
      result.surveyNumber = "[ILLEGIBLE]";
      result.rawText = result.rawText.replace(/\d/g, (match) => 
        Math.random() > 0.7 ? "?" : match
      );
    } else if (result.confidence < 75) {
      // Medium confidence - some uncertainty
      result.rawText += "\n[Some text unclear due to image quality]";
    }

    console.log(`OCR processed file: ${filePath}, confidence: ${result.confidence}%`);
    
    return result;
  }

  /**
   * Reprocess file with manual corrections
   */
  async reprocessWithCorrections(
    filePath: string, 
    corrections: Partial<OCRResult>
  ): Promise<OCRResult> {
    const originalResult = await this.processFile(filePath, "application/pdf");
    
    return {
      ...originalResult,
      ...corrections,
      confidence: 100 // Manual corrections give 100% confidence
    };
  }

  /**
   * Extract entities using mock NLP processing
   */
  async extractEntities(text: string): Promise<{
    villages: string[];
    names: string[];
    areas: string[];
    ids: string[];
  }> {
    // Simulate NLP processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple regex-based entity extraction (mock implementation)
    const villages = this.extractMatches(text, /Village:\s*([A-Za-z\s]+)/gi);
    const names = this.extractMatches(text, /(?:Claimant|Name):\s*([A-Za-z\s]+)/gi);
    const areas = this.extractMatches(text, /Area:\s*([\d.]+)/gi);
    const ids = this.extractMatches(text, /(?:Claim ID|ID):\s*([A-Z0-9-]+)/gi);

    return { villages, names, areas, ids };
  }

  private extractMatches(text: string, regex: RegExp): string[] {
    const matches: string[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches;
  }
}

export const ocrService = new OCRService();
