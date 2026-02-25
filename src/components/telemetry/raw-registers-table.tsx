"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface RawRegistersTableProps {
  registers: Record<string, number>;
}

export function RawRegistersTable({ registers }: RawRegistersTableProps) {
  const sortedEntries = Object.entries(registers).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <ScrollArea className="h-[400px]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Key
            </th>
            <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map(([key, value]) => (
            <tr key={key} className="border-b border-border/30">
              <td className="py-1.5 pr-4 font-mono text-xs text-muted-foreground">
                {key}
              </td>
              <td className="py-1.5 text-right font-mono text-xs text-foreground">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}
