import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PLANS } from "@/lib/plans";
import { createCheckoutSession } from "@/lib/actions/stripe";

interface PricingCardProps {
  plan: keyof typeof PLANS;
  highlighted?: boolean;
}

export function PricingCard({ plan, highlighted }: PricingCardProps) {
  const config = PLANS[plan];

  return (
    <Card
      className={`relative ${highlighted ? "border-blue-500 border-2 shadow-lg" : ""}`}
    >
      {highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
          Populaire
        </Badge>
      )}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{config.name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">
            {config.price === 0 ? "Gratuit" : `CHF ${config.price}`}
          </span>
          {config.price > 0 && (
            <span className="text-muted-foreground">/mois</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {config.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        {plan === "free" ? (
          <Link href="/onboarding" className="block">
            <Button variant="outline" className="w-full">
              Commencer gratuitement
            </Button>
          </Link>
        ) : (
          <form action={createCheckoutSession.bind(null, plan)}>
            <Button
              type="submit"
              className={`w-full ${highlighted ? "bg-blue-500 hover:bg-blue-600" : ""}`}
            >
              Essayer 14 jours gratuit
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
