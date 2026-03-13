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
import { Search, Edit2, Trash2, Plus, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  getInstitutes,
  createInstitute,
  updateInstitute,
  deleteInstitute,
} from "@/api/instituteApi";

type Institute = {
  id: number;
  name: string;
  code: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
};

export default function AdminInstitutesPage() {
  const { toast } = useToast();

  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [form, setForm] = useState<Institute>({
    id: 0,
    name: "",
    code: "",
    address: "",
    email: "",
    phone: "",
    website: "",
  });

  /* ================= LOAD ================= */

  const loadInstitutes = async () => {
    try {
      const data = await getInstitutes();
      setInstitutes(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load institutes",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadInstitutes();
  }, []);

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast({
        title: "Validation error",
        description: "Institute name & code required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEdit) {
        await updateInstitute(form.id, form);
        toast({ title: "Updated successfully" });
      } else {
        await createInstitute(form);
        toast({ title: "Institute added" });
      }

      setOpen(false);
      setIsEdit(false);
      setForm({
        id: 0,
        name: "",
        code: "",
        address: "",
        email: "",
        phone: "",
        website: "",
      });

      loadInstitutes();
    } catch {
      toast({
        title: "Error",
        description: "Operation failed",
        variant: "destructive",
      });
    }
  };

  /* ================= DELETE ================= */
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteInstitute(deleteId);
      toast({ title: "Institute deleted" });
      setDeleteId(null);
      loadInstitutes();
    } catch {
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      });
    }
  };

  /* ================= FILTER ================= */

  const filtered = institutes.filter(
    i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Institute Management</h1>
          <p className="text-muted-foreground">
            Manage institutes and campuses
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setIsEdit(false);
                setForm({
                  id: 0,
                  name: "",
                  code: "",
                  address: "",
                  email: "",
                  phone: "",
                  website: "",
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Institute
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "Edit Institute" : "Add Institute"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={e =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={e =>
                  setForm({ ...form, code: e.target.value })
                }
              />

              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={e =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={e =>
                  setForm({ ...form, phone: e.target.value })
                }
              />

              <Label>Website</Label>
              <Input
                value={form.website}
                onChange={e =>
                  setForm({ ...form, website: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button onClick={handleSave}>
                {isEdit ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 opacity-60" />
        <Input
          placeholder="Search institute..."
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.map(inst => (
            <TableRow key={inst.id}>
              <TableCell className="font-mono font-bold">
                {inst.code}
              </TableCell>

              <TableCell className="flex gap-2 items-center">
                <Building size={16} />
                {inst.name}
              </TableCell>

              <TableCell>{inst.email}</TableCell>

              <TableCell className="text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setForm(inst);
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
                  onClick={() => {
                    setDeleteId(inst.id);
                    setDeleteName(inst.name);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
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
            {deleteName && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 italic">
                <b>Deleting Institute:</b> {deleteName}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Nahi, Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Haan, Delete Kar Do
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
