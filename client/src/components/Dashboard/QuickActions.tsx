import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Plus, 
  Search, 
  Download 
} from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "View Map",
      icon: MapPin,
      color: "text-primary",
      href: "/map",
    },
    {
      title: "New Claim",
      icon: Plus,
      color: "text-accent",
      href: "/claims/new",
    },
    {
      title: "Search Claims",
      icon: Search,
      color: "text-chart-2",
      href: "/claims",
    },
    {
      title: "Export Data",
      icon: Download,
      color: "text-chart-1",
      href: "#",
      onClick: () => {
        // Implement export functionality
        console.log("Export data clicked");
      },
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const ActionButton = (
              <Button
                key={index}
                variant="outline"
                className="flex flex-col items-center p-4 h-auto hover:bg-muted transition-colors"
                onClick={action.onClick}
                data-testid={`action-${action.title.toLowerCase().replace(" ", "-")}`}
              >
                <Icon className={`h-6 w-6 ${action.color} mb-2`} />
                <span className="text-sm font-medium text-foreground">
                  {action.title}
                </span>
              </Button>
            );

            if (action.href && action.href !== "#") {
              return (
                <Link key={index} href={action.href}>
                  <a className="block">{ActionButton}</a>
                </Link>
              );
            }

            return ActionButton;
          })}
        </div>

        {/* Filter Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Filter by Region</h4>
          <div className="space-y-3">
            <Select>
              <SelectTrigger data-testid="select-state">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maharashtra">Maharashtra</SelectItem>
                <SelectItem value="chhattisgarh">Chhattisgarh</SelectItem>
                <SelectItem value="odisha">Odisha</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger data-testid="select-district">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gadchiroli">Gadchiroli</SelectItem>
                <SelectItem value="chandrapur">Chandrapur</SelectItem>
                <SelectItem value="gondia">Gondia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
