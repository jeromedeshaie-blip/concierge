import { PLANS } from "@/lib/plans";
import { PricingCard } from "@/components/pricing-card";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Tarifs simples et transparents
          </h1>
          <p className="text-xl text-muted-foreground">
            Essai gratuit 14 jours — sans carte bancaire
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((plan) => (
            <PricingCard
              key={plan}
              plan={plan}
              highlighted={plan === "pro"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
