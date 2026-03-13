
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, MoreHorizontal, BookOpen } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: number;
  code: string;
  title: string;
  semesterId?: number;
  programId?: number;
  branchId?: number;
  filesCount?: number;
  // Fields from teacher's my-courses endpoint
  courseId?: number;
  academicYear?: string;
  section?: string;
  departmentName?: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user, activeRole, hasPermission } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user can manage courses (HOD or ADMIN)
  const canManageCourses = hasPermission("MANAGE_COURSES");

  // Check if viewing as teacher (TEACHER role or HOD acting as teacher)
  const isTeacherView = activeRole === "TEACHER";

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    semester: "1",
    instructor: ""
  });

  useEffect(() => {
    fetchCourses();
  }, [activeRole]);

  const fetchCourses = async () => {
    try {
      // Use different endpoints based on role and active view
      const endpoint = isTeacherView ? "/api/teacher/my-courses" : "/api/hod/courses";
      const res = await authFetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();

      // Normalize the data structure
      const normalizedCourses = Array.isArray(data) ? data.map((c: any) => ({
        id: c.courseId || c.id,
        code: c.code,
        title: c.title,
        semesterId: c.semesterId,
        programId: c.programId,
        academicYear: c.academicYear,
        section: c.section,
        departmentName: c.departmentName,
        filesCount: c.filesCount || 0
      })) : [];

      setCourses(normalizedCourses);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not load courses",
        variant: "destructive"
      });
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        code: formData.code,
        title: formData.title,
        programId: 1,
        branchId: 1,
        semesterId: parseInt(formData.semester) || 1,
        credits: 4,
        contactHour: 40
      };

      const res = await authFetch("/api/hod/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create course");
      }

      toast({
        title: "Course Added",
        description: `${formData.title} has been created successfully.`,
      });

      setIsAddOpen(false);
      setFormData({ code: "", title: "", semester: "1", instructor: "" });
      fetchCourses();

    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err.message || "Server Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isTeacherView ? "My Courses" : "Courses"}
          </h1>
          {isTeacherView && (
            <p className="text-muted-foreground text-sm mt-1">
              Courses assigned to you by your department
            </p>
          )}
        </div>
        {canManageCourses && !isTeacherView && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCourse} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Course Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g. CS202"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Algorithms"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="semester">Semester (ID)</Label>
                  <Input
                    id="semester"
                    placeholder="e.g. 1"
                    type="number"
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Course"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              {isTeacherView ? (
                <>
                  <TableHead>Section</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Academic Year</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Semester ID</TableHead>
                  <TableHead>Program ID</TableHead>
                </>
              )}
              <TableHead className="text-right">Files</TableHead>
              {canManageCourses && !isTeacherView && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length === 0 && (
              <TableRow>
                <TableCell colSpan={isTeacherView ? 5 : 6} className="text-center text-muted-foreground py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  {isTeacherView
                    ? "No courses assigned to you yet. Please contact your HOD."
                    : "No courses found. Add one to get started."}
                </TableCell>
              </TableRow>
            )}
            {filteredCourses.map((course) => (
              <TableRow key={`${course.id}-${course.section}-${course.academicYear}`}>
                <TableCell className="font-medium">{course.code}</TableCell>
                <TableCell>{course.title}</TableCell>
                {isTeacherView ? (
                  <>
                    <TableCell>
                      <Badge variant="secondary">{course.section || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>{course.departmentName || "N/A"}</TableCell>
                    <TableCell>{course.academicYear || "N/A"}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{course.semesterId}</TableCell>
                    <TableCell>{course.programId}</TableCell>
                  </>
                )}
                <TableCell className="text-right">{course.filesCount || 0}</TableCell>
                {canManageCourses && !isTeacherView && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
