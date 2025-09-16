import { Header } from "@/components/Layout/Header";
import { FileUpload as FileUploadComponent } from "@/components/FileUpload/FileUpload";

export default function FileUpload() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Document Upload"
        description="Upload and process forest rights documents with OCR"
      />
      
      <main className="p-6">
        <FileUploadComponent />
      </main>
    </div>
  );
}
