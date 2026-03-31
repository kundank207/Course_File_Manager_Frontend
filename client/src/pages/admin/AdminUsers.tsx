import { useState, useEffect } from "react";
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
  Search, Trash2, UserPlus, MoreHorizontal, CheckCircle2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";

/* ================= TYPES ================= */

interface BackendUser {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "HOD" | "SUBJECT_HEAD";
  isActive: boolean;
  createdAt: string;
}

/* ================= COMPONENT ================= */

export default function AdminUsersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");


  const [isAddOpen, setIsAddOpen] = useState(false);


  const [isFetching, setIsFetching] = useState(true);

  /* ================= LOAD USERS ================= */

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsFetching(true);
    try {
      const res = await authFetch("/api/admin/pending-teachers");

      if (!res.ok) {
        toast({
          title: "Unauthorized",
          description: "Please login again",
          variant: "destructive",
        });
        setUsers([]);
        return;
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast({
        title: "Error",
        description: "Unable to load users",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsFetching(false);
    }
  };

  /* ================= APPROVE USER ================= */

  const approveUser = async (userId: number) => {
    try {
      const res = await authFetch(`/api/admin/approve/${userId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Approval Failed",
          description: err.message || "Unable to approve user",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "User Approved", description: "User moved to Faculty" });
      // Remove from this list after approval
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      toast({
        title: "Server Error",
        description: "Backend se connect nahi ho paa raha",
        variant: "destructive",
      });
    }
  };

  const [userToDelete, setUserToDelete] = useState<BackendUser | null>(null);

  /* ================= DELETE USER ================= */

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await authFetch(`/api/admin/delete/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast({ title: "Delete Failed", variant: "destructive" });
        return;
      }

      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast({ title: "User Deleted Successfully" });
      setUserToDelete(null);
    } catch {
      toast({
        title: "Server Error",
        description: "Backend se connect nahi ho paa raha",
        variant: "destructive",
      });
    }
  };

  /* ================= FILTER ================= */

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Pending user approvals
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsAddOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isFetching ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-slate-500 font-medium">Fetching secure records...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                No pending users found
              </TableCell>
            </TableRow>
          ) : null}

          {!isFetching && filteredUsers.map(user => (
            <TableRow key={user.id}>
              <TableCell>#{user.id}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge>{user.role}</Badge>
              </TableCell>
              <TableCell>
                {user.isActive ? "Active" : "Inactive"}
              </TableCell>
              <TableCell>
                {user.createdAt?.split("T")[0]}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">

                    {!user.isActive && (
                      <DropdownMenuItem onClick={() => approveUser(user.id)}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setUserToDelete(user)}
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

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!userToDelete} onOpenChange={o => !o && setUserToDelete(null)}>
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
            {userToDelete && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-700"><b>User:</b> {userToDelete.username} ({userToDelete.email})</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Nahi, Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Haan, Delete Kar Do
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
