import { Header } from "@/components/Layout/Header";
import { ClaimsTable } from "@/components/Claims/ClaimsTable";

export default function ClaimsManagement() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Claims Management"
        description="Manage and review forest rights claims"
      />
      
      <main className="p-6">
        <ClaimsTable showHeader={false} />
      </main>
    </div>
  );
}
