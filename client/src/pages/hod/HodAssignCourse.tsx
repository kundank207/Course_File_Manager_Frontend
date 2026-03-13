import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, BookOpen, Pencil, Trash2, Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

interface Teacher {
  id: number;
  name: string;
  departmentName?: string;
  departmentCode?: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Course {
  id: number;
  code: string;
  title: string;
}

interface CourseAssignment {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  teacherId: number;
  teacherName: string;
  departmentId?: number;
  section: string;
  academicYear: string;
  isSubjectHead: boolean;
}

/* ================= COMPONENT ================= */

export default function HodAssignCourse() {
  const { toast } = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);

  const [teacherId, setTeacherId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [section, setSection] = useState("");
  const [isSubjectHead, setIsSubjectHead] = useState(false);
  const [teacherSearchOpen, setTeacherSearchOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseAssignment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<CourseAssignment | null>(null);

  /* ===== BULK ASSIGNMENT STATE ===== */
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    failureCount: number;
    errors: string[];
  } | null>(null);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadDepartments();
    loadCourses();
    loadAssignments();
  }, []);

  const downloadAssignmentTemplate = async () => {
    try {
      const res = await authFetch("/api/hod/bulk-import/assignment/template");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "assignment_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Template download failed", variant: "destructive" });
    }
  };

  const handleAssignmentImport = async () => {
    if (!importFile) return;

    // We can use the first departmentId from the list as a fallback or identified from state.
    // In HOD context, they usually manage one department.
    const deptId = departments[0]?.id;

    if (!deptId) {
      toast({ title: "Department Error", description: "HOD department could not be identified", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("departmentId", String(deptId));

      const res = await authFetch("/api/hod/bulk-import/assignment", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setImportResult(data);
      if (data.successCount > 0) {
        toast({ title: "Import Successful", description: `Assigned ${data.successCount} courses successfully` });
        loadAssignments();
      }
    } catch {
      toast({ title: "Import Error", description: "Batch assignment failed", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    if (departmentId) {
      loadTeachers(Number(departmentId));
    } else {
      setTeachers([]);
      setTeacherId("");
    }
  }, [departmentId]);
  const loadDepartments = async () => {
    try {
      const res = await authFetch("/api/hod/departments");
      if (!res.ok) throw new Error();
      setDepartments(await res.json());
    } catch {
      toast({
        title: "Error",
        description: "Unable to load departments",
        variant: "destructive",
      });
    }
  };

  const loadTeachers = async (deptId: number) => {
    try {
      const res = await authFetch(`/api/hod/teachers-by-department?department_id=${deptId}`);
      if (!res.ok) throw new Error();
      setTeachers(await res.json());
    } catch {
      toast({
        title: "Error",
        description: "Unable to load teachers for this department",
        variant: "destructive",
      });
    }
  };

  const loadCourses = async () => {
    try {
      const res = await authFetch("/api/hod/courses");
      if (!res.ok) throw new Error();
      setCourses(await res.json());
    } catch {
      toast({
        title: "Error",
        description: "Unable to load courses",
        variant: "destructive",
      });
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await authFetch("/api/hod/course-assignments");
      if (!res.ok) throw new Error();
      setAssignments(await res.json());
    } catch {
      toast({
        title: "Error",
        description: "Unable to load assignments",
        variant: "destructive",
      });
    }
  };

  /* ================= ASSIGN / UPDATE ================= */

  const saveAssignment = async () => {
    if (!teacherId || !courseId || !academicYear || !section) {
      toast({
        title: "Missing fields",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        teacherId: Number(teacherId),
        departmentId: Number(departmentId),
        courseId: Number(courseId),
        academicYear,
        section,
        isSubjectHead,
      };

      const res = editing
        ? await authFetch(`/api/hod/course-assignments/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        : await authFetch("/api/hod/assign-course", {
          method: "POST",
          body: JSON.stringify(payload),
        });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Operation failed");
      }

      toast({
        title: "Success",
        description: editing
          ? "Assignment updated successfully"
          : isSubjectHead
            ? "Course assigned successfully. Teacher is now Subject Head for this course."
            : "Course assigned successfully",
      });

      resetForm();
      loadAssignments();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Unable to save assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const confirmDelete = (assignment: CourseAssignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  const deleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      const res = await authFetch(`/api/hod/course-assignments/${assignmentToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Delete failed");
      }

      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });

      loadAssignments();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Unable to delete assignment",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    }
  };

  /* ================= EDIT ================= */

  const openEditDialog = (assignment: CourseAssignment) => {
    setEditing(assignment);
    const deptId = assignment.departmentId || "";
    setDepartmentId(deptId ? String(deptId) : "");
    setTeacherId(String(assignment.teacherId));
    setCourseId(String(assignment.courseId));
    setAcademicYear(assignment.academicYear);
    setSection(assignment.section);
    setIsSubjectHead(assignment.isSubjectHead);
    setOpen(true);
  };

  const resetForm = () => {
    setTeacherId("");
    setDepartmentId("");
    setCourseId("");
    setAcademicYear("");
    setSection("");
    setIsSubjectHead(false);
    setEditing(null);
    setOpen(false);
  };
  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assigned Courses</h1>
          <p className="text-muted-foreground mt-1">Map faculty members to their respective courses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadAssignmentTemplate}>
            <BookOpen className="mr-2 h-4 w-4" /> Download Template
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <Plus className="mr-2 h-4 w-4" /> Bulk Assignment
          </Button>
          <Button onClick={() => {
            const year = new Date().getFullYear();
            setAcademicYear(`${year}-${year + 1}`);
            setOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Assign Course
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Subject Head</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {assignments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                No course assignments found
              </TableCell>
            </TableRow>
          )}

          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">
                {assignment.courseCode} — {assignment.courseTitle}
              </TableCell>
              <TableCell>{assignment.teacherName}</TableCell>
              <TableCell>{assignment.section}</TableCell>
              <TableCell>{assignment.academicYear}</TableCell>
              <TableCell>
                {assignment.isSubjectHead ? (
                  <Badge variant="default" className="bg-green-600">
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    No
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(assignment)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => confirmDelete(assignment)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Assign/Edit Course Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Assignment" : "Assign Course to Faculty"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* DEPARTMENT */}
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TEACHER (Searchable Combobox) */}
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Popover open={teacherSearchOpen} onOpenChange={setTeacherSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={teacherSearchOpen}
                    className="w-full justify-between"
                    disabled={!departmentId}
                  >
                    {teacherId
                      ? teachers.find((t) => String(t.id) === teacherId)?.name +
                      (teachers.find((t) => String(t.id) === teacherId)?.departmentCode ? ` (${teachers.find((t) => String(t.id) === teacherId)?.departmentCode})` : "")
                      : "Select Teacher..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search teacher..." />
                    <CommandList>
                      <CommandEmpty>No teacher found.</CommandEmpty>
                      <CommandGroup>
                        {teachers.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={t.name}
                            onSelect={() => {
                              setTeacherId(String(t.id));
                              setTeacherSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                teacherId === String(t.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {t.name} ({t.departmentCode})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* COURSE */}
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.code} — {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ACADEMIC YEAR */}
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const years = [];
                    for (let i = -1; i <= 3; i++) {
                      const startYear = currentYear + i;
                      const endYear = startYear + 1;
                      years.push(`${startYear}-${endYear}`);
                    }
                    return years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* SECTION */}
            <div className="space-y-2">
              <Label>Section</Label>
              <Input
                placeholder="e.g. A"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>

            {/* IS SUBJECT HEAD CHECKBOX */}
            <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
              <Checkbox
                id="isSubjectHead"
                checked={isSubjectHead}
                onCheckedChange={(checked) => setIsSubjectHead(checked === true)}
              />
              <div className="space-y-0.5">
                <Label htmlFor="isSubjectHead" className="cursor-pointer font-medium">
                  Assign as Subject Head
                </Label>
                <p className="text-xs text-muted-foreground">
                  This teacher will be the Subject Head for this course and can approve other teachers' course files.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={saveAssignment} disabled={loading}>
              {loading ? "Saving..." : editing ? "Update" : "Assign Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This will remove{" "}
              <strong>{assignmentToDelete?.teacherName}</strong> from{" "}
              <strong>{assignmentToDelete?.courseCode}</strong> (Section{" "}
              {assignmentToDelete?.section}, {assignmentToDelete?.academicYear}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAssignment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== BULK ASSIGNMENT IMPORT MODAL ===== */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Bulk Course Assignment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!importResult ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  importFile ? "border-green-400 bg-green-50/50" : "border-muted hover:border-green-400 hover:bg-green-50/30"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) setImportFile(e.dataTransfer.files[0]);
                }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={cn("p-3 rounded-full", importFile ? "bg-green-100 text-green-600" : "bg-green-100 text-green-600")}>
                    <Plus className="h-8 w-8" />
                  </div>
                  {importFile ? (
                    <div>
                      <p className="font-semibold text-green-700">{importFile.name}</p>
                      <p className="text-sm text-green-600">FILE SELECTED</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">Drag & drop assignment Excel here</p>
                      <p className="text-sm text-muted-foreground">or click browse</p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    id="assignment-import-file"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  <Button variant="secondary" asChild disabled={isImporting}>
                    <Label htmlFor="assignment-import-file" className="cursor-pointer">
                      Browse Files
                    </Label>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-lg bg-muted/40 border">
                  <div className="flex-1 text-center border-r">
                    <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Success</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.failureCount}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Failed</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 bg-red-50/30 text-sm">
                    <p className="font-semibold text-red-700 mb-2">Error Log:</p>
                    <ul className="space-y-1 list-disc list-inside text-red-600 px-2">
                      {importResult.errors.slice(0, 20).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 20 && <li>...and {importResult.errors.length - 20} more errors</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {importResult ? (
              <Button className="w-full" onClick={() => { setIsImportOpen(false); setImportResult(null); setImportFile(null); }}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setIsImportOpen(false)} disabled={isImporting}>Cancel</Button>
                <Button variant="default" onClick={handleAssignmentImport} disabled={!importFile || isImporting} className="bg-green-600 hover:bg-green-700">
                  {isImporting ? "Processing..." : "Start Import"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}