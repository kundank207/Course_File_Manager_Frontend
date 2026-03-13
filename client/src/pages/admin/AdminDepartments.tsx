import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  checkDeleteDepartment,
  confirmDeleteDepartment,
} from "@/api/departments";

import { getInstitutes } from "@/api/instituteApi";

type DeptForm = {
  id: number | null;
  name: string;
  code: string;
  instituteId: string;
};

export default function AdminDepartmentsPage() {
  const { toast } = useToast();

  const [departments, setDepartments] = useState<any[]>([]);
  const [institutes, setInstitutes] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteMsg, setDeleteMsg] = useState("");

  const emptyForm: DeptForm = {
    id: null,
    name: "",
    code: "",
    instituteId: "",
  };

  const [form, setForm] = useState<DeptForm>(emptyForm);

  /* ================= LOAD ================= */

  const loadAll = async () => {
    try {
      const d = await getDepartments();
      setDepartments(d);
    } catch (e) {
      console.error("Departments failed", e);
    }

    try {
      const i = await getInstitutes();
      setInstitutes(i);
    } catch (e) {
      console.error("Institutes failed", e);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!form.name || !form.code || !form.instituteId) {
      toast({
        title: "Validation",
        description: "Name, Code & Institute required",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: form.name,
      code: form.code,
      instituteId: Number(form.instituteId),
    };

    try {
      if (isEdit) {
        await updateDepartment(form.id!, payload);
      } else {
        await createDepartment(payload);
      }

      toast({ title: isEdit ? "Updated" : "Created" });

      setOpen(false);
      setIsEdit(false);
      setForm(emptyForm);
      loadAll();
    } catch {
      toast({
        title: "Error",
        description: "Save failed",
        variant: "destructive",
      });
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id: number) => {
    try {
      const msg = await checkDeleteDepartment(id);
      setDeleteId(id);
      setDeleteMsg(msg);
      setConfirmOpen(true);
    } catch {
      toast({
        title: "Error",
        description: "Delete check failed",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    try {
      await confirmDeleteDepartment(deleteId!);
      toast({ title: "Deleted" });
      setConfirmOpen(false);
      loadAll();
    } catch {
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      });
    }
  };

  /* ================= FILTER ================= */

  const filtered = departments.filter((d) =>
    `${d.name} ${d.code}`.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Departments</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setIsEdit(false);
                setForm(emptyForm);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Department
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "Edit" : "Create"} Department
              </DialogTitle>
            </DialogHeader>

            <Label>Institute</Label>
            <Select
              value={form.instituteId}
              onValueChange={(v) =>
                setForm({ ...form, instituteId: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Institute" />
              </SelectTrigger>
              <SelectContent>
                {institutes.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <Label>Code</Label>
            <Input
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value })
              }
            />

            <DialogFooter>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Search department..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Institute</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.code}</TableCell>
              <TableCell>{d.name}</TableCell>
              <TableCell>{d.institute?.name}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setForm({
                      id: d.id,
                      name: d.name,
                      code: d.code,
                      instituteId: String(d.institute?.id),
                    });
                    setIsEdit(true);
                    setOpen(true);
                  }}
                >
                  <Edit2 size={16} />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => handleDelete(d.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
            {deleteMsg && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 italic">{deleteMsg}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Nahi, Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Haan, Delete Kar Do
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
