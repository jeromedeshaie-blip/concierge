import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone } from "lucide-react";
import { MemberCardActions } from "./delete-member-button";
import type { Profile } from "@/lib/types/profile";
import { roleLabels } from "@/lib/types/profile";

const roleVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  admin: "destructive",
  manager: "default",
  owner: "secondary",
  cleaner: "outline",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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

  const canManage = profile?.role === "admin";

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  const members = (data as Profile[]) || [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Équipe</h1>
          <p className="mt-1 text-muted-foreground">
            Gestion de l&apos;équipe.
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/team/new">
            <Button>
              <Plus className="size-4" data-icon="inline-start" />
              Inviter
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {members.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Aucun membre pour le moment.
          </p>
          {canManage && (
            <Link
              href="/dashboard/team/new"
              className="mt-4 inline-block"
            >
              <Button variant="outline">
                <Plus className="size-4" data-icon="inline-start" />
                Inviter un membre
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle>{member.full_name}</CardTitle>
                {canManage && member.id !== user!.id && (
                  <CardAction>
                    <MemberCardActions
                      memberId={member.id}
                      memberName={member.full_name}
                    />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <Badge variant={roleVariant[member.role] ?? "secondary"}>
                  {roleLabels[member.role]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
