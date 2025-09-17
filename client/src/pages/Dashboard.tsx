import { Header } from "@/components/Layout/Header";
import { StatsGrid } from "@/components/Dashboard/StatsGrid";
import { QuickActions } from "@/components/Dashboard/QuickActions";
import { FileUpload } from "@/components/FileUpload/FileUpload";
import { EnhancedMapComponent } from "@/components/Map/EnhancedMapComponent";
import { ClaimsTable } from "@/components/Claims/ClaimsTable";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Dashboard Overview"
        description="Monitor and manage forest rights claims across regions"
      />
      
      <main className="p-6">
        <StatsGrid />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FileUpload />
          <QuickActions />
        </div>

        <div className="mb-8">
          <EnhancedMapComponent height="500px" />
        </div>

        <ClaimsTable limit={10} />
      </main>
    </div>
  );
}
