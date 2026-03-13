import { useAuth, UserRole } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Shield, User, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function RoleSwitcher() {
    const { user, activeRole, switchRole, getRoleBasedRedirect } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    if (!user || !user.roles || user.roles.length <= 1) {
        return null;
    }

    const handleRoleSwitch = async (role: UserRole) => {
        if (role === activeRole) return;

        try {
            const result = await switchRole(role);
            if (result.success) {
                toast({
                    title: "Switching Role...",
                    description: `Switching to ${role} view.`,
                });
                const redirectPath = getRoleBasedRedirect(role);
                window.location.href = redirectPath;
            } else {
                toast({
                    variant: "destructive",
                    title: "Role Switch Failed",
                    description: result.message || "Could not switch roles. Please try logging out and in again.",
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "An unexpected error occurred.",
            });
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "ADMIN":
                return <Shield className="h-4 w-4 mr-2 text-red-500" />;
            case "HOD":
                return <Shield className="h-4 w-4 mr-2 text-blue-500" />;
            case "SUBJECTHEAD":
                return <Shield className="h-4 w-4 mr-2 text-green-500" />;
            case "TEACHER":
                return <GraduationCap className="h-4 w-4 mr-2 text-amber-500" />;
            default:
                return <User className="h-4 w-4 mr-2" />;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "ADMIN": return "Admin Workspace";
            case "HOD": return "HOD Workspace";
            case "SUBJECTHEAD": return "Subject Head Workspace";
            case "TEACHER": return "Teacher Workspace";
            default: return `${role} Workspace`;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="flex items-center">
                        {activeRole && getRoleIcon(activeRole)}
                        <span className="font-semibold text-xs tracking-wide uppercase">
                            {activeRole || "Select Role"}
                        </span>
                    </div>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-1.5">
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1.5">
                    Switch Perspective
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mb-1" />
                {user.roles.map((role) => (
                    <DropdownMenuItem
                        key={role}
                        onClick={() => handleRoleSwitch(role as UserRole)}
                        disabled={activeRole === role}
                        className={cn(
                            "flex items-center justify-between cursor-pointer rounded-md px-3 py-2.5 text-sm transition-all mb-1",
                            activeRole === role
                                ? "bg-primary/5 text-primary font-medium opacity-100 ring-1 ring-primary/20"
                                : "hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {getRoleIcon(role)}
                            <div className="flex flex-col">
                                <span className="leading-none">{getRoleLabel(role)}</span>
                                {activeRole === role && <span className="text-[10px] text-muted-foreground font-normal mt-0.5">Active</span>}
                            </div>
                        </div>
                        {activeRole === role && (
                            <div className="h-2 w-2 rounded-full bg-primary shadow-sm" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
