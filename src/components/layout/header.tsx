"use client";

import { useState, useRef, useCallback } from "react";
import { Flame } from "lucide-react";
import { ConnectionIndicator } from "@/components/layout/connection-indicator";
import { useStoveStore } from "@/store/stove-store";
import { useStoveName } from "@/hooks/use-settings";

export function Header() {
  const stove = useStoveStore((s) => s.stove);
  const isOnline = stove?.isOnline ?? false;
  const { name, setName } = useStoveName();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const lastTapRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Даблтап — включаем редактирование
      setDraft(name);
      setEditing(true);
      setTimeout(() => inputRef.current?.select(), 10);
    }
    lastTapRef.current = now;
  }, [name]);

  const handleSave = useCallback(() => {
    setName(draft);
    setEditing(false);
  }, [draft, setName]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="flex h-12 items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-500" />
          {editing ? (
            <input
              ref={inputRef}
              className="w-28 bg-transparent text-lg font-semibold tracking-tight outline-none border-b border-primary"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
              maxLength={20}
            />
          ) : (
            <span
              className="text-lg font-semibold tracking-tight select-none"
              onClick={handleTap}
            >
              {name}
            </span>
          )}
        </div>
        <ConnectionIndicator isOnline={isOnline} />
      </div>
    </header>
  );
}
