import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";
import { Loader2, Award, Zap, PieChart, MoreHorizontal, Mail, Eye } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { HodAppreciationModal } from "@/components/hod/HodAppreciationModal";
import { HodEmailDepartmentModal } from "@/components/hod/HodEmailDepartmentModal";

export default function HodTeachersPage() {
  const navigate = useNavigate();
  const [performance, setPerformance] = useState<any[]>([]);
  const [topPerformer, setTopPerformer] = useState<any>(null);
  const [mostActive, setMostActive] = useState<any>(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [appreciationOpen, setAppreciationOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [perfRes, topRes, actRes, covRes] = await Promise.all([
        authFetch("/api/hod/faculty/performance"),
        authFetch("/api/hod/faculty/top-performer"),
        authFetch("/api/hod/faculty/most-active"),
        authFetch("/api/hod/department/course-coverage")
      ]);

      if (perfRes.ok) setPerformance(await perfRes.json());
      if (topRes.ok) setTopPerformer(await topRes.json());
      if (actRes.ok) setMostActive(await actRes.json());
      if (covRes.ok) setCoverage(await covRes.json());
    } catch (error) {
      console.error("Failed to load faculty performance:", error);
      toast.error("Failed to load some analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAppreciation = (teacherId?: number) => {
    setSelectedTeacherId(teacherId);
    setAppreciationOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Analyzing faculty performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Performance</h1>
          <p className="text-muted-foreground mt-1">Activity-based insights for department staff.</p>
        </div>
        <Button
          variant="outline"
          className="hover:bg-primary hover:text-white transition-colors"
          onClick={() => setEmailModalOpen(true)}
        >
          <Mail className="mr-2 h-4 w-4" /> Email Department
        </Button>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" /> Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center pt-0">
            <div className="h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-4 text-3xl">🏆</div>
            <h3 className="font-bold text-xl">{topPerformer?.name || "N/A"}</h3>
            <p className="text-sm text-muted-foreground mb-4 min-h-[3rem]">{topPerformer?.reason || "Highest contributions this period"}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleOpenAppreciation(topPerformer?.id)}
              disabled={!topPerformer}
            >
              Send Appreciation
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" /> Most Active
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center pt-0">
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 text-3xl">⚡</div>
            <h3 className="font-bold text-xl">{mostActive?.name || "N/A"}</h3>
            <p className="text-sm text-muted-foreground mb-4 min-h-[3rem]">
              {mostActive?.uploads || 0} files uploaded recently
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/hod/teacher-activity/${mostActive?.id}`)}
              disabled={!mostActive}
            >
              View Activity
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-500" /> Course Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center pt-0">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4 text-3xl">📊</div>
            <h3 className="font-bold text-xl">{coverage?.coverage || 0}%</h3>
            <p className="text-sm text-muted-foreground mb-4 min-h-[3rem]">
              {coverage?.active || 0} of {coverage?.total || 0} courses have active materials
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate("/hod/missing-coverage")}
            >
              View Missing
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-muted/50 shadow-sm">
        <CardHeader>
          <CardTitle>Teacher Activity Index</CardTitle>
          <CardDescription>Performance derived from active courses and total uploads.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Active Courses</TableHead>
                <TableHead>Total Uploads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No faculty performance data found.
                  </TableCell>
                </TableRow>
              ) : (
                performance.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={teacher.name}
                          size="sm"
                        />
                        <span className="font-semibold">{teacher.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{teacher.designation || "N/A"}</TableCell>
                    <TableCell>{teacher.activeCourses}</TableCell>
                    <TableCell>{teacher.totalUploads}</TableCell>
                    <TableCell>
                      <Badge
                        variant={teacher.status === 'Excellent' ? 'default' : teacher.status === 'Average' ? 'outline' : 'secondary'}
                        className={teacher.status === 'Excellent' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {teacher.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/hod/teacher-activity/${teacher.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> View Stats
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenAppreciation(teacher.id)}>
                            <Award className="h-4 w-4 mr-2" /> Appreciate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-primary" onClick={() => setEmailModalOpen(true)}>
                            <Mail className="h-4 w-4 mr-2" /> Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODALS */}
      <HodAppreciationModal
        isOpen={appreciationOpen}
        onClose={() => setAppreciationOpen(false)}
        initialTeacherId={selectedTeacherId}
      />

      <HodEmailDepartmentModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}

