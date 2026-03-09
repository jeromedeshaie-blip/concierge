"use client";

import { useRef } from "react";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { logout } from "@/lib/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

const pageLabels: Record<string, string> = {
  dashboard: "nav.dashboard",
  properties: "nav.properties",
  bookings: "nav.bookings",
  tasks: "nav.tasks",
  team: "nav.team",
  settings: "nav.settings",
  new: "common.save",
  ical: "iCal",
};

interface HeaderUser {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export function Header({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const logoutFormRef = useRef<HTMLFormElement>(null);
  const t = useTranslations();

  // Strip locale prefix for breadcrumb segments
  const cleanPath = pathname.replace(/^\/(en|de)/, "");
  const segments = cleanPath.split("/").filter(Boolean);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6 pl-14 md:pl-6">
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/");
            const labelKey = pageLabels[segment];
            const label = labelKey
              ? labelKey === "iCal"
                ? "iCal"
                : t(labelKey)
              : segment;
            const isLast = index === segments.length - 1;

            return (
              <Fragment key={href}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={href} />}>
                      {label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 outline-none hover:bg-muted">
            <Avatar size="sm">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
              )}
              <AvatarFallback>
                {user.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline-block">
              {user.fullName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              {t("nav.profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutFormRef.current?.requestSubmit()}
            >
              <LogOut className="size-4" />
              {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <form ref={logoutFormRef} action={logout} className="hidden" />
    </header>
  );
}
