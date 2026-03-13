interface SidebarHeaderProps {
  title: string;
  subtitle: string;
}

export function SidebarHeader({ title, subtitle }: SidebarHeaderProps) {
  return (
    <div className="p-6 border-b border-sidebar-border/50">
      <span className="font-bold text-xl tracking-tight block leading-none">
        {title}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
        {subtitle}
      </span>
    </div>
  );
}
