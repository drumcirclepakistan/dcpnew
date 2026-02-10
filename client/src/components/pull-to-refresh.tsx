import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const isVerticalRef = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const { toast } = useToast();

  const isAtTop = useCallback(() => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop <= 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (isAtTop()) {
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isVerticalRef.current = null;
    }
  }, [isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null || isRefreshing) return;
    if (!isAtTop()) {
      startYRef.current = null;
      startXRef.current = null;
      isVerticalRef.current = null;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startYRef.current;
    const diffX = Math.abs(currentX - (startXRef.current ?? currentX));

    if (isVerticalRef.current === null) {
      if (Math.abs(diffY) > 10 || diffX > 10) {
        isVerticalRef.current = Math.abs(diffY) > diffX;
      }
      return;
    }

    if (!isVerticalRef.current) return;

    if (diffY > 0) {
      const dampened = Math.min(diffY * 0.5, MAX_PULL);
      setPullDistance(dampened);
    }
  }, [isRefreshing, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    startXRef.current = null;
    isVerticalRef.current = null;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.6);

      try {
        await queryClient.invalidateQueries({ type: "active" });
        toast({ title: "Data refreshed" });
      } catch {
        toast({ title: "Refresh failed", variant: "destructive" });
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, toast]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <main
      ref={containerRef}
      className="flex-1 overflow-auto"
      data-testid="main-content"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance > 0 || isRefreshing ? `${pullDistance}px` : "0px" }}
      >
        <RefreshCw
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isRefreshing ? "animate-spin" : ""}`}
          style={{ transform: `rotate(${progress * 360}deg)`, opacity: progress }}
        />
      </div>
      {children}
    </main>
  );
}
