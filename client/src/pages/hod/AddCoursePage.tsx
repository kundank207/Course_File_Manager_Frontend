import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { authFetch } from "@/utils/authFetch";
import { getPrograms } from "@/api/programApi";
import { getBranches } from "@/api/branchApi";
import { getSemesters } from "@/api/semesterApi";

/* ===== TYPES ===== */
interface Program {
  id: number;
  name: string;
  department?: {
    id: number;
    name: string;
  };
}

interface Branch {
  id: number;
  name: string;
}

interface Semester {
  id: number;
  label: string;
}

interface Course {
  id: number;
  code: string;
  title: string;
  credits: number;
  contactHour: number;
  hasTheory: boolean;
  hasLab: boolean;
  hasProject: boolean;
}

/* ================= COMPONENT ================= */

export default function HodCoursesPage() {
  const { toast } = useToast();

  /* ===== STATE ===== */
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const [form, setForm] = useState({
    programId: "",
    branchId: "",
    semesterId: "",
    code: "",
    title: "",
    credits: "",
    contactHour: "",
    hasTheory: true,
    hasLab: false,
    hasProject: false,
  });

  /* ===== BULK IMPORT STATE ===== */
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    failureCount: number;
    errors: string[];
  } | null>(null);

  /* ================= LOAD ================= */

  useEffect(() => {
    loadProfile();
    loadCourses();
    loadDepartments();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authFetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        // Load programs after we have profile (departmentId)
        loadPrograms(data.departmentId);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const [profile, setProfile] = useState<any>(null);

  const downloadTemplate = async () => {
    try {
      const res = await authFetch("/api/hod/bulk-import/course/template");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "course_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Template download failed", variant: "destructive" });
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await authFetch("/api/hod/departments");
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch { }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;

    // Get HOD departmentId from departments list
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

      const res = await authFetch("/api/hod/bulk-import/course", {
        method: "POST",
        body: formData, // authFetch should handle FormData by NOT setting JSON content-type
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setImportResult(data);
      if (data.successCount > 0) {
        toast({ title: "Import Completed", description: `Successfully imported ${data.successCount} courses` });
        loadCourses();
      }
    } catch {
      toast({ title: "Import Error", description: "Excel file process nahi ho pai", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const loadPrograms = async (deptId?: number) => {
    try {
      const data = await getPrograms();
      let list = Array.isArray(data) ? data : [];
      if (deptId) {
        list = list.filter((p: any) => p.department?.id === deptId);
      }
      setPrograms(list);
    } catch {
      setPrograms([]);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await authFetch("/api/hod/courses");

      if (!res.ok) {
        setCourses([]);
        return;
      }

      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      setCourses([]);
      toast({
        title: "Session expired",
        description: "Please login again",
        variant: "destructive",
      });
    }
  };

  /* ================= CASCADING ================= */

  const onProgramChange = async (programId: string) => {
    setForm({
      programId,
      branchId: "",
      semesterId: "",
      code: "",
      title: "",
      credits: "",
      contactHour: "",
      hasTheory: true,
      hasLab: false,
      hasProject: false,
    });

    setBranches([]);
    setSemesters([]);

    try {
      const data = await getBranches(Number(programId));
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      setBranches([]);
    }
  };

  const onBranchChange = async (branchId: string) => {
    setForm(f => ({ ...f, branchId, semesterId: "" }));

    try {
      const data = await getSemesters(
        Number(form.programId),
        Number(branchId)
      );
      setSemesters(Array.isArray(data) ? data : []);
    } catch {
      setSemesters([]);
    }
  };

  /* ================= VALIDATION ================= */

  const isFormValid = () =>
    form.programId &&
    form.branchId &&
    form.semesterId &&
    form.code.trim() &&
    form.title.trim() &&
    Number(form.credits) > 0 &&
    Number(form.contactHour) > 0;

  /* ================= SAVE ================= */

  const saveCourse = async () => {
    if (!isFormValid()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    const payload = {
      programId: Number(form.programId),
      branchId: Number(form.branchId),
      semesterId: Number(form.semesterId),
      code: form.code,
      title: form.title,
      credits: Number(form.credits),
      contactHour: Number(form.contactHour),
      hasTheory: form.hasTheory,
      hasLab: form.hasLab,
      hasProject: form.hasProject,
    };

    try {
      const res = await authFetch(
        editing ? `/api/hod/courses/${editing.id}` : "/api/hod/courses",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        try {
          const errData = await res.json();
          toast({ title: "Save failed", description: errData.message || "Unknown error", variant: "destructive" });
        } catch (e) {
          toast({ title: "Save failed", description: "Network response was not ok", variant: "destructive" });
        }
        return;
      }

      toast({ title: editing ? "Course updated" : "Course added" });
      resetForm();
      loadCourses();
    } catch {
      toast({ title: "Server error", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setOpen(false);
    setEditing(null);
    setForm({
      programId: "",
      branchId: "",
      semesterId: "",
      code: "",
      title: "",
      credits: "",
      contactHour: "",
      hasTheory: true,
      hasLab: false,
      hasProject: false,
    });
  };

  const setEditingData = (c: Course) => {
    setEditing(c);
    setForm({
      programId: "", // Not editable usually or needs fetching
      branchId: "",
      semesterId: "",
      code: c.code,
      title: c.title,
      credits: String(c.credits),
      contactHour: String(c.contactHour),
      hasTheory: c.hasTheory,
      hasLab: c.hasLab,
      hasProject: c.hasProject,
    });
    setOpen(true);
  };

  /* ================= DELETE ================= */

  const deleteCourse = async (id: number) => {
    try {
      const res = await authFetch(`/api/hod/courses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "Course deleted" });
        loadCourses();
      }
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage department subjects and syllabus</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Plus className="mr-2 h-4 w-4" /> Download Template
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
            <Plus className="mr-2 h-4 w-4" /> Bulk Import
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Course
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Components</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {courses.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted">
                No courses found
              </TableCell>
            </TableRow>
          )}

          {courses.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.code}</TableCell>
              <TableCell>{c.title}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {c.hasTheory && <Badge variant="outline" className="bg-blue-50 text-blue-700">T</Badge>}
                  {c.hasLab && <Badge variant="outline" className="bg-purple-50 text-purple-700">L</Badge>}
                  {c.hasProject && <Badge variant="outline" className="bg-orange-50 text-orange-700">P</Badge>}
                </div>
              </TableCell>
              <TableCell>{c.credits}</TableCell>
              <TableCell>{c.contactHour}</TableCell>
              <TableCell className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingData(c)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteCourse(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ===== DIALOG ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] gap-0 p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {editing ? "Edit Course" : "Add Course"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Program</Label>
                <Select value={form.programId} onValueChange={onProgramChange}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} ({p.department?.name || "No Dept"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Branch</Label>
                <Select value={form.branchId} onValueChange={onBranchChange}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Semester</Label>
                <Select
                  value={form.semesterId}
                  onValueChange={v =>
                    setForm(f => ({ ...f, semesterId: v }))
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Code</Label>
                <Input
                  placeholder="e.g. CS101"
                  className="h-10 rounded-xl"
                  value={form.code}
                  onChange={e =>
                    setForm(f => ({ ...f, code: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Credits</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-10 rounded-xl"
                  value={form.credits}
                  onChange={e =>
                    setForm(f => ({ ...f, credits: e.target.value }))
                  }
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Title</Label>
                <Input
                  placeholder="Name of the course"
                  className="h-10 rounded-xl"
                  value={form.title}
                  onChange={e =>
                    setForm(f => ({ ...f, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Hours</Label>
                <Input
                  type="number"
                  placeholder="40"
                  className="h-10 rounded-xl"
                  value={form.contactHour}
                  onChange={e =>
                    setForm(f => ({ ...f, contactHour: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Components</Label>
                <div className="flex items-center gap-4 h-10 px-3 border rounded-xl bg-slate-50/50">
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="checkbox"
                      id="theory"
                      checked={form.hasTheory}
                      onChange={e => setForm(f => ({ ...f, hasTheory: e.target.checked }))}
                      className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                    />
                    <Label htmlFor="theory" className="text-[10px] font-black cursor-pointer uppercase">T</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="checkbox"
                      id="lab"
                      checked={form.hasLab}
                      onChange={e => setForm(f => ({ ...f, hasLab: e.target.checked }))}
                      className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer"
                    />
                    <Label htmlFor="lab" className="text-[10px] font-black cursor-pointer uppercase">L</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="checkbox"
                      id="project"
                      checked={form.hasProject}
                      onChange={e => setForm(f => ({ ...f, hasProject: e.target.checked }))}
                      className="w-3.5 h-3.5 text-orange-600 rounded cursor-pointer"
                    />
                    <Label htmlFor="project" className="text-[10px] font-black cursor-pointer uppercase">P</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button onClick={saveCourse} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200">
              {editing ? "Update Course" : "Save Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== IMPORT MODAL ===== */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Bulk Course Import
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!importResult ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  importFile ? "border-green-400 bg-green-50/50" : "border-muted hover:border-indigo-400 hover:bg-indigo-50/30"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) setImportFile(e.dataTransfer.files[0]);
                }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={cn("p-3 rounded-full", importFile ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600")}>
                    <Plus className="h-8 w-8" />
                  </div>
                  {importFile ? (
                    <div>
                      <p className="font-semibold text-green-700">{importFile.name}</p>
                      <p className="text-sm text-green-600">FILE SELECTED</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">Drag & drop your Excel file here</p>
                      <p className="text-sm text-muted-foreground">or click the button below to browse</p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    id="course-import-file"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  <Button variant="secondary" asChild disabled={isImporting}>
                    <Label htmlFor="course-import-file" className="cursor-pointer">
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
                <Button variant="default" onClick={handleImportSubmit} disabled={!importFile || isImporting} className="bg-indigo-600 hover:bg-indigo-700">
                  {isImporting ? "Processing..." : "Start Processing"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
