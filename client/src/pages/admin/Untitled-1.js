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

import { Plus, Trash2, BookOpen, GitBranch, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";

// API IMPORTS
import { getDepartments } from "@/api/departments";
import { getPrograms, createProgram, deleteProgram } from "@/api/programApi";
import { getBranches, createBranch, deleteBranch } from "@/api/branchApi";
import { getSemesters, createSemester, deleteSemester } from "@/api/semesterApi";

export default function AdminProgramsPage() {

  const { toast } = useToast();

  // =======================
  // STATES
  // =======================
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [programForm, setProgramForm] = useState({
    name: "",
    code: "",
    duration_year: "",
    degree_type: "",
    department_id: "",
  });

  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    program_id: "",
  });

  const [semesterForm, setSemesterForm] = useState({
    semester_number: "",
    label: "",
    program_id: "",
    branch_id: "",
  });

  const [isProgramOpen, setIsProgramOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isSemesterOpen, setIsSemesterOpen] = useState(false);

  // =======================
  // LOAD DATA
  // =======================
  const loadDepartments = async () => {
    const res = await getDepartments();
    setDepartments(res.data);
  };

  const loadPrograms = async () => {
    const res = await getPrograms();
    setPrograms(res.data);
  };

  const loadBranches = async (programId: number) => {
    if (!programId) return setBranches([]);
    const res = await getBranches(programId);
    setBranches(res.data);
  };

  const loadSemesters = async (programId: number, branchId: number) => {
    if (!programId || !branchId) return setSemesters([]);
    const res = await getSemesters(programId, branchId);
    setSemesters(res.data);
  };

  useEffect(() => {
    loadDepartments();
    loadPrograms();
  }, []);

  // =======================
  // CREATE PROGRAM
  // =======================
  const addProgram = async () => {
    await createProgram(programForm);
    toast({ title: "Program Added Successfully" });
    setIsProgramOpen(false);
    loadPrograms();
  };

  // =======================
  // CREATE BRANCH
  // =======================
  const addBranch = async () => {
    await createBranch(branchForm);
    toast({ title: "Branch Added Successfully" });
    setIsBranchOpen(false);
    loadBranches(branchForm.program_id);
  };

  // =======================
  // CREATE SEMESTER
  // =======================
  const addSemester = async () => {
    await createSemester(semesterForm);
    toast({ title: "Semester Added Successfully" });
    setIsSemesterOpen(false);

    loadSemesters(semesterForm.program_id, semesterForm.branch_id);
  };

  // =======================
  // DELETE HANDLERS
  // =======================
  const removeProgram = async (id: number) => {
    await deleteProgram(id);
    toast({ title: "Program Deleted" });
    loadPrograms();
  };

  const removeBranch = async (id: number) => {
    await deleteBranch(id);
    toast({ title: "Branch Deleted" });
    loadBranches(branchForm.program_id);
  };

  const removeSemester = async (id: number) => {
    await deleteSemester(id);
    toast({ title: "Semester Deleted" });
    loadSemesters(semesterForm.program_id, semesterForm.branch_id);
  };

  // =======================
  // UI
  // =======================
  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">Academic Structure</h1>
      <p className="text-muted-foreground">Manage programs, branches, and semesters.</p>

      <Tabs defaultValue="programs" className="space-y-4">

        {/* TABS */}
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="semesters">Semesters</TabsTrigger>
        </TabsList>

        {/* ======================= PROGRAM TAB ======================= */}
        <TabsContent value="programs">
          <div className="bg-white p-4 rounded-md shadow">

            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Programs</h2>

              {/* PROGRAM DIALOG */}
              <Dialog open={isProgramOpen} onOpenChange={setIsProgramOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2" /> Add Program</Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader><DialogTitle>Add Program</DialogTitle></DialogHeader>

                  <div className="space-y-3">

                    {/* Department */}
                    <Label>Department</Label>
                    <Select
                      onValueChange={(v) =>
                        setProgramForm({ ...programForm, department_id: v })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id.toString()}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Program fields */}
                    <Label>Name</Label>
                    <Input onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} />

                    <Label>Code</Label>
                    <Input onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })} />

                    <Label>Duration</Label>
                    <Input type="number" onChange={(e) => setProgramForm({ ...programForm, duration_year: e.target.value })} />

                    <Label>Degree Type</Label>
                    <Input onChange={(e) => setProgramForm({ ...programForm, degree_type: e.target.value })} />

                  </div>

                  <DialogFooter>
                    <Button onClick={addProgram}>Save</Button>
                  </DialogFooter>

                </DialogContent>
              </Dialog>
            </div>

            {/* PROGRAM TABLE */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {programs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.code}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {p.name}
                    </TableCell>
                    <TableCell>{p.duration_year} Years</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" onClick={() => removeProgram(p.id)}>
                        <Trash2 className="text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>

          </div>
        </TabsContent>

        {/* ======================= BRANCH TAB ======================= */}
        <TabsContent value="branches">
          <div className="bg-white p-4 rounded-md shadow">

            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Branches</h2>

              {/* BRANCH DIALOG */}
              <Dialog open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2" /> Add Branch</Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader><DialogTitle>Add Branch</DialogTitle></DialogHeader>

                  <div className="space-y-3">
                    <Label>Program</Label>
                    <Select
                      onValueChange={(v) => {
                        setBranchForm({ ...branchForm, program_id: v });
                        loadBranches(Number(v));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label>Branch Name</Label>
                    <Input onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />

                    <Label>Code</Label>
                    <Input onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} />
                  </div>

                  <DialogFooter>
                    <Button onClick={addBranch}>Save</Button>
                  </DialogFooter>

                </DialogContent>
              </Dialog>
            </div>

            {/* BRANCH TABLE */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.code}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" /> {b.name}
                    </TableCell>
                    <TableCell>{programs.find((p) => p.id == b.program_id)?.name}</TableCell>

                    <TableCell className="text-right">
                      <Button variant="ghost" onClick={() => removeBranch(b.id)}>
                        <Trash2 className="text-red-600" />
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>

            </Table>

          </div>
        </TabsContent>

        {/* ======================= SEMESTER TAB ======================= */}
        <TabsContent value="semesters">
          <div className="bg-white p-4 rounded-md shadow">

            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Semesters</h2>

              {/* SEMESTER DIALOG */}
              <Dialog open={isSemesterOpen} onOpenChange={setIsSemesterOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2" /> Add Semester</Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader><DialogTitle>Add Semester</DialogTitle></DialogHeader>

                  <div className="space-y-3">
                    <Label>Program</Label>
                    <Select
                      onValueChange={(v) => {
                        setSemesterForm({ ...semesterForm, program_id: v });
                        loadBranches(Number(v));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label>Branch</Label>
                    <Select
                      onValueChange={(v) => {
                        setSemesterForm({ ...semesterForm, branch_id: v });
                        loadSemesters(Number(semesterForm.program_id), Number(v));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label>Semester Number</Label>
                    <Input
                      type="number"
                      onChange={(e) => setSemesterForm({...semesterForm, semester_number: e.target.value})}
                    />

                    <Label>Label</Label>
                    <Input
                      onChange={(e) => setSemesterForm({...semesterForm, label: e.target.value})}
                    />
                  </div>

                  <DialogFooter>
                    <Button onClick={addSemester}>Save</Button>
                  </DialogFooter>

                </DialogContent>
              </Dialog>
            </div>

            {/* SEMESTER TABLE */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {semesters.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.semester_number}</TableCell>

                    <TableCell className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> {s.label}
                    </TableCell>

                    <TableCell>
                      {programs.find((p) => p.id == s.program_id)?.name}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="ghost" onClick={() => removeSemester(s.id)}>
                        <Trash2 className="text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>

          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
}
