export interface Profile {
  id: string;
  role: "admin" | "owner" | "manager" | "cleaner";
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const roleLabels: Record<Profile["role"], string> = {
  admin: "Administrateur",
  owner: "Propriétaire",
  manager: "Gestionnaire",
  cleaner: "Personnel de ménage",
};
