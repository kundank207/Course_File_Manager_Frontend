import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Shield, Trash2, Edit2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";

interface Role {
  id: number;
  name: string;
  users: number;
  permissions: string[];
}

export default function AdminRolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const allPermissions = [
    "create_course_file",
    "upload_document",
    "submit_file",
    "approve_file",
    "manage_dept",
    "view_reports",
    "edit_course",
    "delete_course",
    "all"
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      } else {
        toast({ title: "Error", description: "Failed to load roles", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      toast({ title: "Error", description: "Failed to load roles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions([...role.permissions]);
    setIsEditOpen(true);
  };

  const handleUpdatePermissions = async () => {
    if (!editingRole) return;

    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/roles/${editingRole.name}`, {
        method: "PUT",
        body: JSON.stringify({ permissions: selectedPermissions }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRoles(roles.map(r => r.name === updated.name ? updated : r));
        toast({ title: "Success", description: `Permissions updated for ${editingRole.name}. Notifications sent to affected users.` });
        setIsEditOpen(false);
        setEditingRole(null);
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to update permissions", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast({ title: "Error", description: "Failed to update permissions", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (perm: string) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading roles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Configure access levels for different user types.</p>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Active Users</TableHead>
              <TableHead>Permissions Summary</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {role.name}
                </TableCell>
                <TableCell>{role.users} users</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {role.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs font-mono">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600"
                    onClick={() => openEditDialog(role)}
                    data-testid={`button-edit-role-${role.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Permissions for {editingRole?.name}</DialogTitle>
            <DialogDescription>
              Update permissions for this role. All users with this role will be notified via email and in-app notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3">
                {allPermissions.map(perm => (
                  <div key={perm} className="flex items-center gap-2 border p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{perm.replace(/_/g, " ").toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdatePermissions}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Permissions"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
