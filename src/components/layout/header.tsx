"use client";

import { Flame } from "lucide-react";
import { ConnectionIndicator } from "@/components/layout/connection-indicator";
import { useStoveStore } from "@/store/stove-store";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const stove = useStoveStore((s) => s.stove);
  const isOnline = stove?.isOnline ?? false;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-amber-500" />
        <span className="text-lg font-semibold tracking-tight">
          {title ?? "Kalor"}
        </span>
      </div>
      <ConnectionIndicator isOnline={isOnline} />
    </header>
  );
}
