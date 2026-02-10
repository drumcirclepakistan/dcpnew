import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { CalendarDays, DollarSign, TrendingUp, Music } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { Show } from "@shared/schema";

function StatCard({
  label,
  value,
  icon: Icon,
  testId,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1" data-testid={testId}>
              {value}
            </p>
          </div>
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="w-10 h-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

const showTypeBadgeVariant = (type: string) => {
  switch (type) {
    case "Corporate": return "default";
    case "University": return "secondary";
    case "Private": return "outline";
    case "Public": return "secondary";
    default: return "outline";
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: shows, isLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const upcomingShows = shows?.filter((s) => s.status === "upcoming") || [];
  const totalRevenue = shows?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
  const totalAdvance = shows?.reduce((sum, s) => sum + s.advancePayment, 0) || 0;
  const pendingAmount = totalRevenue - totalAdvance;

  const nextShows = upcomingShows
    .sort((a, b) => new Date(a.showDate).getTime() - new Date(b.showDate).getTime())
    .slice(0, 5);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" data-testid="text-welcome">
          Welcome back, {user?.displayName || "Founder"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's what's happening with Drum Circle Pakistan
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Shows"
              value={shows?.length || 0}
              icon={Music}
              testId="stat-total-shows"
            />
            <StatCard
              label="Upcoming"
              value={upcomingShows.length}
              icon={CalendarDays}
              testId="stat-upcoming"
            />
            <StatCard
              label="Total Revenue"
              value={`Rs ${totalRevenue.toLocaleString()}`}
              icon={TrendingUp}
              testId="stat-revenue"
            />
            <StatCard
              label="Pending"
              value={`Rs ${pendingAmount.toLocaleString()}`}
              icon={DollarSign}
              testId="stat-pending"
            />
          </>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h2 className="text-base font-semibold">Upcoming Shows</h2>
          <Link href="/shows">
            <span className="text-sm text-primary font-medium cursor-pointer" data-testid="link-view-all-shows">
              View all
            </span>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : nextShows.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-upcoming">
                No upcoming shows scheduled
              </p>
              <Link href="/shows/new">
                <span className="text-sm text-primary font-medium mt-2 cursor-pointer" data-testid="link-add-first-show">
                  Add your first show
                </span>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {nextShows.map((show) => (
              <Link key={show.id} href={`/shows/${show.id}`}>
                <Card className="hover-elevate cursor-pointer" data-testid={`card-show-${show.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`text-show-title-${show.id}`}>
                          {show.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {show.city}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(show.showDate), "MMM d, yyyy")}
                          </span>
                        </div>
                        {show.organizationName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {show.organizationName}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <Badge variant={showTypeBadgeVariant(show.showType) as any}>
                          {show.showType}
                        </Badge>
                        <span className="text-sm font-semibold" data-testid={`text-show-amount-${show.id}`}>
                          Rs {show.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
