import { useEffect, useState } from "react";
import { authFetch } from "@/utils/authFetch";
import {
  Table, TableHeader, TableRow, TableHead,
  TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Search } from "lucide-react";

/* ===== TYPES ===== */
type RoleType = "TEACHER" | "SUBJECTHEAD";

interface Faculty {
  id: number;
  name: string;
  email: string;
  role: RoleType;
  designation?: string;
  isActive: boolean;
  department?: { name: string };
}

/* ===== COMPONENT ===== */
export default function DepartmentFacultyPage() {
  const { toast } = useToast();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Faculty | null>(null);

  const [form, setForm] = useState({
    role: "TEACHER" as RoleType,
    designation: "",
  });

  /* ===== LOAD ===== */
  useEffect(() => {
    authFetch("http://localhost:8080/api/hod/faculty")
      .then(res => res.json())
      .then(data => {
      setFaculty(Array.isArray(data) ? data : []);
      })
      .catch(() =>
        toast({
          title: "Error",
          description: "Faculty load failed",
          variant: "destructive",
        })
      );
  }, []);

  /* ===== SAVE ===== */
  const saveEdit = async () => {
    if (!editing) return;

    try {
      const res = await authFetch(
        `http://localhost:8080/api/hod/faculty/${editing.id}`,
        {
          method: "PUT",
          body: JSON.stringify(form),
        }
      );

      const updated = await res.json();
      setFaculty(prev =>
        prev.map(f => (f.id === updated.id ? updated : f))
      );

      toast({ title: "Updated successfully" });
      setEditing(null);
    } catch {
      toast({
        title: "Error",
        description: "Update failed",
        variant: "destructive",
      });
    }
  };

  const filtered = faculty.filter(f =>
    `${f.name} ${f.email} ${f.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ===== UI ===== */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Department Faculty</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2 h-4 w-4" />
        <Input
          className="pl-8"
          placeholder="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.map(f => (
            <TableRow key={f.id}>
              <TableCell>{f.name}</TableCell>
              <TableCell>{f.email}</TableCell>
              <TableCell><Badge>{f.role}</Badge></TableCell>
              <TableCell>{f.isActive ? "Active" : "Inactive"}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => {
                  setEditing(f);
                  setForm({
                    role: f.role,
                    designation: f.designation || "",
                  });
                }}>
                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
          </DialogHeader>

          <Select
            value={form.role}
            onValueChange={v =>
              setForm(f => ({ ...f, role: v as RoleType }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TEACHER">TEACHER</SelectItem>
              <SelectItem value="SUBJECTHEAD">SUBJECT HEAD</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Designation"
            value={form.designation}
            onChange={e =>
              setForm(f => ({ ...f, designation: e.target.value }))
            }
          />

          <DialogFooter>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
