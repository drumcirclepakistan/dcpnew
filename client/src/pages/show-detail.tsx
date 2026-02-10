import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Pencil,
  Trash2,
  StickyNote,
} from "lucide-react";
import { format } from "date-fns";
import type { Show } from "@shared/schema";

const statusColors: Record<string, string> = {
  upcoming: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: show, isLoading } = useQuery<Show>({
    queryKey: ["/api/shows", id],
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/shows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      toast({ title: "Show deleted" });
      navigate("/shows");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-md" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-muted-foreground">Show not found</p>
            <Link href="/shows">
              <Button variant="outline" className="mt-4">
                Back to Shows
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingAmount = show.totalAmount - show.advancePayment;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/shows")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-show-detail-title">
              {show.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant={statusColors[show.status] as any}>
                {show.status}
              </Badge>
              <Badge variant="outline">{show.showType}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/shows/${id}/edit`}>
            <Button variant="outline" data-testid="button-edit-show">
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="button-delete-show">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this show?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{show.title}" from your records.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  data-testid="button-confirm-delete"
                  onClick={() => deleteMutation.mutate()}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">City</p>
              <p className="text-sm font-medium" data-testid="text-detail-city">{show.city}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Date & Time</p>
              <p className="text-sm font-medium" data-testid="text-detail-date">
                {format(new Date(show.showDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {show.organizationName && (
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {show.showType === "University" ? "University" : "Company"}
                </p>
                <p className="text-sm font-medium" data-testid="text-detail-org">
                  {show.organizationName}
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold text-foreground" data-testid="text-detail-total">
                  Rs {show.totalAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Advance</p>
                <p className="text-lg font-bold text-foreground" data-testid="text-detail-advance">
                  Rs {show.advancePayment.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-primary" data-testid="text-detail-pending">
                  Rs {pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {show.notes && (
            <div className="border-t pt-5">
              <div className="flex items-start gap-3">
                <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap mt-1" data-testid="text-detail-notes">
                    {show.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
