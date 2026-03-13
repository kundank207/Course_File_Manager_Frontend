
import { KPICard } from "@/components/dashboard/KPICard";
import { hodStats } from "@/lib/dummy-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function DepartmentStats() {
  return (
    <div className="space-y-6 mb-8 border-b pb-8 border-border/50">
      <div className="flex items-center justify-between">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-bold uppercase tracking-wider text-purple-600">Department Management</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Department Overview</h2>
        </div>
        <Link to="/hod/overview">
            <Button variant="outline" className="text-purple-700 border-purple-200 hover:bg-purple-50">
            View Full Report <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {hodStats.map((stat) => (
          <KPICard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}
