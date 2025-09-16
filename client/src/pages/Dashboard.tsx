import { Header } from "@/components/Layout/Header";
import { StatsGrid } from "@/components/Dashboard/StatsGrid";
import { QuickActions } from "@/components/Dashboard/QuickActions";
import { FileUpload } from "@/components/FileUpload/FileUpload";
import { MapComponent } from "@/components/Map/MapComponent";
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
          <MapComponent height="500px" />
        </div>

        <ClaimsTable limit={10} />
      </main>
    </div>
  );
}
