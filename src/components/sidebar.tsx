"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  ClipboardList,
  Users,
  Settings,
  Menu,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Propriétés", href: "/dashboard/properties", icon: Building2 },
  { label: "Réservations", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "Tâches", href: "/dashboard/tasks", icon: ClipboardList },
  { label: "Équipe", href: "/dashboard/team", icon: Users },
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

interface SidebarUser {
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

function SidebarContent({
  user,
  onNavigate,
}: {
  user: SidebarUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
          onClick={onNavigate}
        >
          <Building2 className="size-5" />
          <span>NendazTech</span>
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="flex items-center gap-3 p-4">
        <Avatar size="sm">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
          )}
          <AvatarFallback>
            {user.fullName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-medium">{user.fullName}</span>
          <span className="truncate text-xs text-muted-foreground">
            {user.role}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-40 md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
        <span className="sr-only">Menu</span>
      </Button>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar md:flex md:flex-col">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
