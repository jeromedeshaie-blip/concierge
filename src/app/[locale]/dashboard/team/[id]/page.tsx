import { Link } from "@/i18n/routing";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateMember } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default async function EditMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard/team");
  }

  const { data: member } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!member) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/team"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour à l&apos;équipe
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le membre</CardTitle>
          <CardDescription>
            Modifiez les informations de {member.full_name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form action={updateMember} className="space-y-4">
            <input type="hidden" name="member_id" value={member.id} />

            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Jean Dupont"
                required
                defaultValue={member.full_name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                disabled
                defaultValue={member.email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+41 79 123 45 67"
                defaultValue={member.phone || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <select
                id="role"
                name="role"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                required
                defaultValue={member.role}
              >
                <option value="admin">Administrateur</option>
                <option value="owner">Propriétaire</option>
                <option value="manager">Gestionnaire</option>
                <option value="cleaner">Personnel de ménage</option>
              </select>
            </div>

            <Button type="submit" className="w-full">
              Enregistrer les modifications
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
