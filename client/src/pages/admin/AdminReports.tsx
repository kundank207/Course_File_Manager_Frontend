
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const monthlyData = [
  { name: 'Jan', uploads: 450, users: 120 },
  { name: 'Feb', uploads: 620, users: 140 },
  { name: 'Mar', uploads: 890, users: 180 },
  { name: 'Apr', uploads: 810, users: 160 },
  { name: 'May', uploads: 1200, users: 210 },
  { name: 'Jun', uploads: 1450, users: 250 },
];

const storageData = [
  { name: 'Documents', value: 450 },
  { name: 'Media', value: 320 },
  { name: 'Archives', value: 150 },
  { name: 'Others', value: 80 },
];

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b'];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into platform usage and storage metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth vs Uploads</CardTitle>
            <CardDescription>Correlation between new users and content generation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="uploads" stroke="#2563eb" name="Uploads" />
                  <Line yAxisId="right" type="monotone" dataKey="users" stroke="#10b981" name="New Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Distribution</CardTitle>
             <CardDescription>Space utilization by file category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={storageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {storageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Recent System Events</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {[1,2,3,4,5].map((i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div>
                            <p className="font-medium">System Backup Completed</p>
                            <p className="text-sm text-muted-foreground">Automated nightly backup ran successfully.</p>
                        </div>
                        <div className="text-sm text-muted-foreground">2 hours ago</div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
