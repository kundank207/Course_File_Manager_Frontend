import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Plus, Trash2, BookOpen, GitBranch, Calendar, Edit2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// APIs
import { getDepartments } from "@/api/departments";
import {
  getPrograms, createProgram, updateProgram, deleteProgram
} from "@/api/programApi";
import {
  getBranches, getAllBranches, createBranch, deleteBranch
} from "@/api/branchApi";
import {
  getAllSemesters, createSemester, deleteSemester, generateBulkSemesters
} from "@/api/semesterApi";

export default function AdminProgramsPage() {
  const { toast } = useToast();

  /* ================= STATE ================= */
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [allBranches, setAllBranches] = useState<any[]>([]);
  const [allSemesters, setAllSemesters] = useState<any[]>([]);
  const [semesterBranches, setSemesterBranches] = useState<any[]>([]);

  const [programForm, setProgramForm] = useState<any>({
    id: null, name: "", code: "", duration_year: "", degree_type: "", department_id: ""
  });

  const [branchForm, setBranchForm] = useState<any>({
    name: "", code: "", program_id: ""
  });

  const [semesterForm, setSemesterForm] = useState<any>({
    semester_number: "", label: "", program_id: "", branch_id: ""
  });

  const [openProgram, setOpenProgram] = useState(false);
  const [openBranch, setOpenBranch] = useState(false);
  const [openSemester, setOpenSemester] = useState(false);
  const [editProgram, setEditProgram] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [bulkForm, setBulkForm] = useState<any>({
    programId: "", branchId: "", total: ""
  });

  const toArray = (res: any) => Array.isArray(res) ? res : res?.data || [];

  /* ================= LOADERS ================= */
  useEffect(() => {
    (async () => {
      setDepartments(toArray(await getDepartments()));
      setPrograms(toArray(await getPrograms()));
      setAllBranches(toArray(await getAllBranches()));
      setAllSemesters(toArray(await getAllSemesters()));
    })();
  }, []);

  /* ================= PROGRAM ================= */
  /* ================= PROGRAM ================= */
  const saveProgram = async () => {
    try {
      const res = editProgram
        ? await updateProgram(programForm.id, programForm)
        : await createProgram(programForm);

      if (!res.ok) {
        try {
          const err = await res.json();
          throw new Error(err.message || "Failed to save program");
        } catch (parsingErr) {
          throw new Error("Failed to save program (Server Error)");
        }
      }

      toast({ title: editProgram ? "Program Updated" : "Program Added" });
      setOpenProgram(false);
      setEditProgram(false);
      setPrograms(toArray(await getPrograms()));
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Operation failed", variant: "destructive" });
    }
  };

  const removeProgram = async (id: number) => {
    try {
      const res = await deleteProgram(id);
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Program Deleted" });
      setPrograms(toArray(await getPrograms()));
    } catch (e) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  /* ================= BRANCH ================= */
  const saveBranch = async () => {
    try {
      if (!branchForm.program_id) {
        toast({ title: "Validation Error", description: "Program is required", variant: "destructive" });
        return;
      }

      // Convert to DTO format (camelCase)
      const payload = {
        name: branchForm.name,
        code: branchForm.code,
        programId: Number(branchForm.program_id)
      };

      const res = await createBranch(payload);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create branch");
      }

      toast({ title: "Branch Added" });
      setOpenBranch(false);
      setBranchForm({ name: "", code: "", program_id: "" });
      setAllBranches(toArray(await getAllBranches()));
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to save branch",
        variant: "destructive"
      });
    }
  };

  const removeBranch = async (id: number) => {
    try {
      const res = await deleteBranch(id);
      if (!res.ok) throw new Error("Failed to delete");

      toast({ title: "Branch Deleted" });
      setAllBranches(toArray(await getAllBranches()));
    } catch (e) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  /* ================= SEMESTER ================= */
  const loadSemesterBranches = async (programId: number) => {
    if (!programId) return setSemesterBranches([]);
    const res = await getBranches(programId);
    setSemesterBranches(toArray(res)); // getBranches assumes direct data return in current api wrapper but let's be safe. Wait, api wrapper returns data or [] already?
    // Checking api wrapper: getBranches returns array. 
  };

  const saveSemester = async () => {
    try {
      const res = await createSemester(semesterForm);
      // createSemester returns Response object? No, check api/semesterApi.ts.
      // Assuming it's consistent with others. If it returns parsed data, logic differs.
      // checking api/semesterApi.ts... "return authFetch..."
      // Yes, it returns Response.

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save semester");
      }

      toast({ title: "Semester Added" });
      setOpenSemester(false);
      setSemesterForm({ semester_number: "", label: "", program_id: "", branch_id: "" });
      setSemesterBranches([]);
      setAllSemesters(toArray(await getAllSemesters()));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleBulkGenerate = async () => {
    try {
      if (!bulkForm.programId || !bulkForm.branchId || !bulkForm.total) {
        toast({ title: "Error", description: "All fields are required", variant: "destructive" });
        return;
      }
      const res = await generateBulkSemesters(bulkForm);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to generate");
      }
      toast({ title: "Semesters Generated" });
      setOpenBulk(false);
      setBulkForm({ programId: "", branchId: "", total: "" });
      setAllSemesters(toArray(await getAllSemesters()));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  /* ================= DELETE SYNC ================= */
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number | null, type: 'program' | 'branch' | 'semester' | null, label: string }>({
    id: null, type: null, label: ""
  });

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;

    try {
      let res;
      if (deleteConfirm.type === 'program') res = await deleteProgram(deleteConfirm.id);
      else if (deleteConfirm.type === 'branch') res = await deleteBranch(deleteConfirm.id);
      else res = await deleteSemester(deleteConfirm.id);

      if (!res.ok) throw new Error("Delete failed");

      toast({ title: `${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)} Deleted` });

      // Refresh relevant list
      if (deleteConfirm.type === 'program') setPrograms(toArray(await getPrograms()));
      else if (deleteConfirm.type === 'branch') setAllBranches(toArray(await getAllBranches()));
      else setAllSemesters(toArray(await getAllSemesters()));

      setDeleteConfirm({ id: null, type: null, label: "" });
    } catch (e) {
      toast({ title: "Error", description: "Delete operation failed", variant: "destructive" });
    }
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Academic Structure</h1>

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="semesters">Semesters</TabsTrigger>
        </TabsList>

        {/* ================= PROGRAMS ================= */}
        <TabsContent value="programs">
          <div className="flex justify-end mb-4">
            <Dialog open={openProgram} onOpenChange={setOpenProgram}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditProgram(false);
                  setProgramForm({ id: null, name: "", code: "", duration_year: "", degree_type: "", department_id: "" });
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Program
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editProgram ? "Edit Program" : "Add Program"}</DialogTitle>
                </DialogHeader>

                <Label>Department</Label>
                <Select
                  value={programForm.department_id}
                  onValueChange={(v) => setProgramForm({ ...programForm, department_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input placeholder="Name" value={programForm.name}
                  onChange={e => setProgramForm({ ...programForm, name: e.target.value })} />
                <Input placeholder="Code" value={programForm.code}
                  onChange={e => setProgramForm({ ...programForm, code: e.target.value })} />
                <Input type="number" placeholder="Duration (Years)" value={programForm.duration_year}
                  onChange={e => setProgramForm({ ...programForm, duration_year: e.target.value })} />
                <Input placeholder="Degree Type" value={programForm.degree_type}
                  onChange={e => setProgramForm({ ...programForm, degree_type: e.target.value })} />

                <DialogFooter>
                  <Button onClick={saveProgram}>{editProgram ? "Update" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.code}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <BookOpen size={16} /> {p.name}
                  </TableCell>
                  <TableCell>{p.department?.name || "-"}</TableCell>
                  <TableCell>{p.duration_year} Years</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditProgram(true);
                      setProgramForm(p);
                      setOpenProgram(true);
                    }}>
                      <Edit2 size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-600"
                      onClick={() => setDeleteConfirm({ id: p.id, type: 'program', label: p.name })}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ================= BRANCHES ================= */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openBranch} onOpenChange={setOpenBranch}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Branch</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader><DialogTitle>Add Branch</DialogTitle></DialogHeader>

                <Label>Program</Label>
                <Select
                  value={branchForm.program_id}
                  onValueChange={(v) => setBranchForm({ ...branchForm, program_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                  <SelectContent>
                    {programs.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} ({p.department?.name || "No Dept"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input placeholder="Branch Name"
                  value={branchForm.name}
                  onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
                <Input placeholder="Code"
                  value={branchForm.code}
                  onChange={e => setBranchForm({ ...branchForm, code: e.target.value })} />

                <DialogFooter>
                  <Button onClick={saveBranch}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBranches.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{b.code}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <GitBranch size={16} /> {b.name}
                  </TableCell>
                  <TableCell>
                    {b.program?.name} ({b.program?.department?.name || "-"})
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="text-red-600"
                      onClick={() => setDeleteConfirm({ id: b.id, type: 'branch', label: b.name })}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ================= SEMESTERS ================= */}
        <TabsContent value="semesters" className="space-y-4">
          <div className="flex justify-end gap-2">
            {/* ADD INDIVIDUAL SEMESTER */}
            <Dialog
              open={openSemester}
              onOpenChange={(open) => {
                setOpenSemester(open);
                if (!open) {
                  setSemesterForm({ semester_number: "", label: "", program_id: "", branch_id: "" });
                  setSemesterBranches([]);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Semester</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Semester</DialogTitle></DialogHeader>

                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Program</Label>
                    <Select
                      value={semesterForm.program_id}
                      onValueChange={(v) => {
                        setSemesterForm({ ...semesterForm, program_id: v, branch_id: "" });
                        loadSemesterBranches(Number(v));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                      <SelectContent>
                        {programs.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} ({p.department?.name || "No Dept"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Branch</Label>
                    <Select
                      value={semesterForm.branch_id}
                      onValueChange={(v) => setSemesterForm({ ...semesterForm, branch_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                      <SelectContent>
                        {semesterBranches.map(b => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input type="number" placeholder="Semester No"
                    value={semesterForm.semester_number}
                    onChange={e => setSemesterForm({ ...semesterForm, semester_number: e.target.value })} />
                  <Input placeholder="Label"
                    value={semesterForm.label}
                    onChange={e => setSemesterForm({ ...semesterForm, label: e.target.value })} />
                </div>

                <DialogFooter className="mt-6">
                  <Button onClick={saveSemester} className="w-full">Save Semester</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* BULK GENERATOR */}
            <Dialog open={openBulk} onOpenChange={setOpenBulk}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" /> Bulk Generate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Bulk Generate Semesters
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label>Program</Label>
                    <Select
                      value={bulkForm.programId}
                      onValueChange={(v) => {
                        setBulkForm({ ...bulkForm, programId: v, branchId: "" });
                        loadSemesterBranches(Number(v));
                      }}
                    >
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select Program" /></SelectTrigger>
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
                    <Label>Branch</Label>
                    <Select
                      value={bulkForm.branchId}
                      onValueChange={(v) => setBulkForm({ ...bulkForm, branchId: v })}
                    >
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                      <SelectContent>
                        {semesterBranches.map(b => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Total Semesters (e.g. 8)</Label>
                    <Input
                      type="number"
                      placeholder="Enter number (e.g. 8)"
                      value={bulkForm.total}
                      className="rounded-xl"
                      onChange={e => setBulkForm({ ...bulkForm, total: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleBulkGenerate} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-indigo-100">
                    Generate Semesters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSemesters.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.semester_number}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Calendar size={16} /> {s.label}
                  </TableCell>
                  <TableCell>
                    {s.program?.name} ({s.program?.department?.name || "-"})
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="text-red-600"
                      onClick={() => setDeleteConfirm({ id: s.id, type: 'semester', label: s.label })}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* GLOBAL ACADEMIC DELETE CONFIRM */}
      <Dialog open={!!deleteConfirm.id} onOpenChange={o => !o && setDeleteConfirm({ id: null, type: null, label: "" })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-slate-800">
              Kya aap sach mein ise delete karna chahte hain? Isse data hamesha ke liye chala jayega.
            </p>
            {deleteConfirm.label && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 italic">
                <b>Deleting {deleteConfirm.type}:</b> {deleteConfirm.label}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirm({ id: null, type: null, label: "" })}>
              Nahi, Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Haan, Delete Kar Do
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
