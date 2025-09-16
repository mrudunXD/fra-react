import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { FileText, CheckCircle, Ruler, Clock } from "lucide-react";

export function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: api.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-24 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Failed to load statistics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Total Claims",
      value: stats.totalClaims.toLocaleString(),
      change: "+12.5%",
      changeLabel: "from last month",
      icon: FileText,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Processed",
      value: stats.processed.toLocaleString(),
      change: "+8.2%",
      changeLabel: "completion rate",
      icon: CheckCircle,
      iconColor: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Total Area",
      value: stats.totalArea.toLocaleString(),
      change: "",
      changeLabel: "hectares mapped",
      icon: Ruler,
      iconColor: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Pending Review",
      value: stats.pending.toLocaleString(),
      change: "-5.8%",
      changeLabel: "from last week",
      icon: Clock,
      iconColor: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p 
                    className="text-3xl font-bold text-foreground"
                    data-testid={`stat-${stat.title.toLowerCase().replace(" ", "-")}`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {stat.change && (
                  <span 
                    className={`font-medium ${
                      stat.change.startsWith("+") ? "text-accent" : "text-chart-1"
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
                <span className={`text-muted-foreground ${stat.change ? "ml-1" : ""}`}>
                  {stat.changeLabel}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
