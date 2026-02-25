"use client";

import { useState } from "react";
import { Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PowerToggleProps {
  isOn: boolean;
  onToggle: () => void;
  isSending?: boolean;
}

export function PowerToggle({
  isOn,
  onToggle,
  isSending = false,
}: PowerToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (isSending) return;
    if (isOn) {
      setShowConfirm(true);
    } else {
      onToggle();
    }
  };

  const handleConfirmOff = () => {
    setShowConfirm(false);
    onToggle();
  };

  return (
    <>
      <Button
        size="lg"
        onClick={handleClick}
        disabled={isSending}
        className={cn(
          "h-14 w-full gap-2 text-base font-medium transition-all",
          isSending && "opacity-80",
          isOn
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        {isSending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Power className="h-5 w-5" />
        )}
        {isSending ? "Sending..." : isOn ? "ON" : "OFF"}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn off stove?</DialogTitle>
            <DialogDescription>
              Are you sure you want to turn off the stove? The cooling cycle
              will begin automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmOff}
            >
              Turn Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
