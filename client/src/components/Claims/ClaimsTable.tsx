import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Eye, Edit, MapPin, ArrowRight, Trash2 } from "lucide-react";
import type { ClaimWithFiles } from "@/types";

interface ClaimsTableProps {
  limit?: number;
  showHeader?: boolean;
}

export function ClaimsTable({ limit = 50, showHeader = true }: ClaimsTableProps) {
  const { data: claims, isLoading, error } = useQuery({
    queryKey: ["/api/claims", limit],
    queryFn: () => api.getClaims(limit),
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: api.deleteClaim,
    onSuccess: () => {
      toast({
        title: "Claim Deleted",
        description: "The claim has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete claim",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (claimId: string) => {
    if (confirm("Are you sure you want to delete this claim?")) {
      deleteMutation.mutate(claimId);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-accent/10 text-accent",
      pending: "bg-chart-1/10 text-chart-1",
      rejected: "bg-destructive/10 text-destructive",
      review_required: "bg-chart-2/10 text-chart-2",
    } as const;

    const variant = variants[status as keyof typeof variants] || variants.pending;

    return (
      <Badge className={variant}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return "bg-muted";
    if (confidence >= 80) return "bg-accent";
    if (confidence >= 60) return "bg-chart-1";
    return "bg-destructive";
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        {showHeader && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Recent Claims
              </CardTitle>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Claims
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-6 text-center">
          <p className="text-destructive">
            Failed to load claims: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <Card className="shadow-sm">
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Claims
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No claims found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Claims
            </CardTitle>
            <Button variant="link" className="text-primary hover:text-primary/80">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Claim ID
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Claimant
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Village
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Area (Ha)
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  OCR Confidence
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-primary">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary"
                      data-testid={`claim-id-${claim.claimId}`}
                    >
                      {claim.claimId}
                    </Button>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {claim.claimantName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {claim.village}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {claim.area}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(claim.status)}
                  </TableCell>
                  <TableCell>
                    {claim.ocrConfidence ? (
                      <div className="flex items-center">
                        <span 
                          className={`font-medium mr-2 ${
                            claim.ocrConfidence >= 80 ? 'text-accent' :
                            claim.ocrConfidence >= 60 ? 'text-chart-1' :
                            'text-destructive'
                          }`}
                        >
                          {claim.ocrConfidence}%
                        </span>
                        <Progress 
                          value={claim.ocrConfidence} 
                          className="w-16 h-2"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-primary hover:text-primary/80"
                        data-testid={`button-view-${claim.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        data-testid={`button-edit-${claim.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        data-testid={`button-map-${claim.id}`}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(claim.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${claim.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
