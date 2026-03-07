import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { roleLabels } from "@/lib/types/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userData = {
    fullName:
      profile?.full_name || user.user_metadata?.full_name || "Utilisateur",
    email: user.email || "",
    role: roleLabels[profile?.role as keyof typeof roleLabels] || profile?.role || "—",
    avatarUrl: profile?.avatar_url || null,
  };

  return (
    <div className="min-h-screen">
      <Sidebar user={userData} />
      <div className="flex flex-col md:ml-64">
        <Header user={userData} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
