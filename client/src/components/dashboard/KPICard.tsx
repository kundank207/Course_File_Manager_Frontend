
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}

export function KPICard({ label, value, change, icon: Icon, color, onClick }: KPICardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-95 border-l-4"
      )}
      style={{ borderLeftColor: onClick ? (color?.includes('#') ? color : undefined) : undefined }}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className="text-2xl font-bold mt-2 tracking-tight">{value}</h3>
          </div>
          <div className={cn("p-3 rounded-2xl bg-opacity-10", (color || "text-gray-500").replace("text-", "bg-"))}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">{change}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
