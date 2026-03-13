import { cn } from "@/lib/utils";

interface UserAvatarProps {
    name?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string | null;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

export function UserAvatar({
    name,
    firstName,
    lastName,
    imageUrl,
    size = "md",
    className,
}: UserAvatarProps) {
    const getInitials = () => {
        // Trim and clean names
        const fName = firstName?.trim();
        const lName = lastName?.trim();
        const full = name?.trim();

        if (fName && lName) {
            return (fName.charAt(0) + lName.charAt(0)).toUpperCase();
        }

        if (fName) {
            return fName.substring(0, 2).toUpperCase();
        }

        if (full) {
            const parts = full.split(/\s+/);
            if (parts.length >= 2) {
                return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
            }
            return full.substring(0, 2).toUpperCase();
        }

        return "??";
    };

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-xl",
    };

    const initials = getInitials();

    return (
        <div
            className={cn(
                "relative flex shrink-0 overflow-hidden rounded-full transition-all duration-300",
                sizeClasses[size],
                !imageUrl && "bg-primary text-primary-foreground font-bold items-center justify-center",
                className
            )}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={name || "User"}
                    className="aspect-square h-full w-full object-cover animate-in fade-in duration-500"
                    onError={(e) => {
                        // If image fails to load, clear it to show initials
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            ) : (
                <span className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                    {initials}
                </span>
            )}
        </div>
    );
}
