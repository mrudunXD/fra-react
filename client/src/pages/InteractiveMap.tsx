import { Header } from "@/components/Layout/Header";
import { EnhancedMapComponent } from "@/components/Map/EnhancedMapComponent";

export default function InteractiveMap() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Interactive Map"
        description="View and manage forest rights claims on an interactive map"
      />
      
      <main className="p-6">
        <EnhancedMapComponent height="calc(100vh - 200px)" interactive />
      </main>
    </div>
  );
}
