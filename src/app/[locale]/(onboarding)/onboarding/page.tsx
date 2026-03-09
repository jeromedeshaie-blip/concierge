import { createTenant } from "@/lib/actions/tenant";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bienvenue !</CardTitle>
          <CardDescription>
            Créez votre espace NendazTech Concierge
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form action={createTenant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de votre société / agence</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Chalets des Alpes SA"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Créer mon espace
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-4">
            14 jours d&apos;essai gratuit - Sans carte bancaire
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
