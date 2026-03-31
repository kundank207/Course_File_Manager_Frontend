import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Search, Edit2, Trash2, MoreHorizontal, UserCog,
  FilePlus, Download, Upload, AlertCircle, CheckCircle2, RefreshCw
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

type RoleType = "TEACHER" | "HOD" | "SUBJECT_HEAD" | "ADMIN";

interface Department {
  id: number;
  name: string;
}

interface FacultyUser {
  id: number;
  username: string;
  email: string;
  role: RoleType;
  isActive: boolean;
  createdAt: string;
  // Flat fields from backend (not nested in a teacher object)
  teacherId?: number | null;
  name?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  designation?: string | null;
  contactNumber?: string | null;
}

/* ================= COMPONENT ================= */

export default function FacultyDashboard() {
  const { toast } = useToast();

  const [faculty, setFaculty] = useState<FacultyUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] =
    useState<"all" | RoleType>("all");

  const [editingUser, setEditingUser] = useState<FacultyUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<FacultyUser | null>(null);

  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: RoleType;
    departmentId: number | "";
  }>({
    name: "",
    email: "",
    role: "TEACHER",
    departmentId: "",
  });
  // Bulk Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    failureCount: number;
    errors: string[];
  } | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadFaculty();
    loadDepartments();
  }, []);

  const loadFaculty = async () => {
    setIsFetching(true);
    try {
      const res = await authFetch("/api/admin/faculty/all");
      if (!res.ok) {
        console.error("Faculty load failed with status:", res.status);
        setFaculty([]);
        return;
      }
      const data = await res.json();
      console.log("Faculty data loaded:", data);
      setFaculty(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Catch block in loadFaculty:", error);
      toast({
        title: "Sync Error",
        description: "Backend se data fetch nahi ho pa raha",
        variant: "destructive",
      });
      setFaculty([]);
    } finally {
      setIsFetching(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await authFetch("/api/admin/departments");
      if (!res.ok) return setDepartments([]);
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setDepartments([]);
    }
  };

  /* ================= FILTER ================= */

  const filteredFaculty = faculty.filter(u => {
    const name = u.name || u.username;
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? u.isActive
          : !u.isActive;

    const matchesRole =
      roleFilter === "all" ? true : u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  /* ================= EDIT ================= */

  const openEditDialog = (user: FacultyUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || user.username,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await authFetch(
        `/api/admin/faculty/update/${editingUser.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
            departmentId:
              editForm.departmentId === "" ? null : editForm.departmentId,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Update Failed",
          description: err.message || "Could not update faculty",
          variant: "destructive",
        });
        return;
      }

      // Refresh the entire list from server to ensure DTO fields (like departmentName) are accurate
      await loadFaculty();

      toast({ title: "Faculty Updated" });
      setEditingUser(null);
    } catch {
      toast({
        title: "Server Error",
        description: "Backend se connect nahi ho paa raha",
        variant: "destructive",
      });
    }
  };

  /* ================= DELETE ================= */

  const confirmDelete = async () => {
    if (!deleteUser) return;

    try {
      const res = await authFetch(
        `/api/admin/faculty/delete/${deleteUser.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        toast({ title: "Delete Failed", variant: "destructive" });
        return;
      }

      setFaculty(prev => prev.filter(u => u.id !== deleteUser.id));
      toast({ title: "Faculty Deleted" });
      setDeleteUser(null);
    } catch {
      toast({
        title: "Server Error",
        description: "Backend se connect nahi ho paa raha",
        variant: "destructive",
      });
    }
  };
  /* ================= BULK IMPORT ================= */

  const downloadTemplate = async () => {
    try {
      const res = await authFetch("/api/admin/bulk-import/template");
      if (!res.ok) throw new Error("Template download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "faculty_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      toast({ title: "Error", description: "Template download fail ho gaya", variant: "destructive" });
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const res = await authFetch("/api/admin/bulk-import/faculty", {
        method: "POST",
        body: formData, // authFetch should handle FormData by not setting JSON content-type
      });

      if (!res.ok) throw new Error("Import failed");

      const data = await res.json();
      setImportResult(data);

      if (data.successCount > 0) {
        toast({ title: "Success", description: `${data.successCount} faculty imported.` });
        loadFaculty();
      }
    } catch (error) {
      toast({ title: "Import Error", description: "Excel file process nahi ho pai", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };
  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Faculty Hub</h1>
          <p className="text-muted-foreground">Manage institution staff and bulk onboard teachers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} className="rounded-xl border-dashed">
            <Download className="mr-2 h-4 w-4" /> Template
          </Button>
          <Button onClick={() => setIsImportOpen(true)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
            <FilePlus className="mr-2 h-4 w-4" /> Bulk Import
          </Button>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-wrap gap-3 p-4 border rounded-lg">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search faculty..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="TEACHER">TEACHER</SelectItem>
            <SelectItem value="HOD">HOD</SelectItem>
            <SelectItem value="SUBJECT_HEAD">SUBJECT_HEAD</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isFetching ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-slate-500 font-medium">Fetching secure records...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredFaculty.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                No faculty found
              </TableCell>
            </TableRow>
          ) : null}

          {!isFetching && filteredFaculty.map(user => (
            <TableRow key={user.id}>
              <TableCell>#{user.id}</TableCell>
              <TableCell>{user.name || user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.departmentName || "-"}</TableCell>
              <TableCell><Badge>{user.role}</Badge></TableCell>
              <TableCell>{user.isActive ? "Active" : "Inactive"}</TableCell>
              <TableCell>{user.createdAt?.split("T")[0]}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(user)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteUser(user)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* EDIT DIALOG */}
      <Dialog open={!!editingUser} onOpenChange={o => !o && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center">
              <UserCog className="h-5 w-5" /> Edit Faculty
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={e =>
                  setEditForm(f => ({ ...f, name: e.target.value }))
                }
              />

              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={e =>
                  setEditForm(f => ({ ...f, email: e.target.value }))
                }
              />

              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v: any) =>
                  setEditForm(f => ({ ...f, role: v }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">TEACHER</SelectItem>
                  <SelectItem value="HOD">HOD</SelectItem>
                </SelectContent>
              </Select>

              {/* 🔥 DEPARTMENT SELECT */}
              <Label>Department</Label>
              <Select
                value={editForm.departmentId === "" ? "none" : String(editForm.departmentId)}
                onValueChange={(v: string) =>
                  setEditForm(f => ({
                    ...f,
                    departmentId: v === "none" ? "" : Number(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Assigned</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteUser} onOpenChange={o => !o && setDeleteUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 font-medium">
              Kya aap sach mein ise delete karna chahte hain? Isse data hamesha ke liye chala jayega.
            </p>
            {deleteUser && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-700"><b>Faculty:</b> {deleteUser.name || deleteUser.username} ({deleteUser.email})</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Nahi, Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Haan, Delete Kar Do
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* BULK IMPORT DIALOG */}
      <Dialog open={isImportOpen} onOpenChange={(o) => {
        setIsImportOpen(o);
        if (!o) {
          setImportFile(null);
          setImportResult(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Upload className="h-5 w-5 text-indigo-600" /> Bulk Faculty Onboarding
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!importResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    Excel file upload karke aap ek saath kai teachers add kar sakte hain.
                    Sabhi ko automatically login credentials mil jayenge.
                  </p>
                </div>

                <div
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
                    importFile ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  )}
                  onClick={() => document.getElementById('faculty-file')?.click()}
                >
                  <input
                    id="faculty-file"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  {importFile ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-slate-900">{importFile.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">File Selected</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-600">Click to Browse Excel File</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Only .xlsx or .xls supported</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{importResult.successCount}</p>
                    <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Success</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <p className="text-2xl font-bold text-rose-600">{importResult.failureCount}</p>
                    <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Failed</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="max-h-[150px] overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Error Logs</p>
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-[10px] text-rose-600 font-medium mb-1">• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {!importResult ? (
              <>
                <Button variant="ghost" onClick={() => setIsImportOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button
                  onClick={handleImportSubmit}
                  disabled={!importFile || isImporting}
                  className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isImporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Start Processing"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsImportOpen(false)} className="w-full rounded-xl bg-slate-900 font-bold">
                Close & Refresh Hub
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
