import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "pro",
  [process.env.STRIPE_BUSINESS_PRICE_ID ?? ""]: "business",
};

function mapStripeStatus(status: string): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "cancelled";
    default:
      return "inactive";
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Webhook invalide" }, { status: 400 });
  }

  const subscription = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await supabaseAdmin.rpc("update_tenant_plan", {
        p_stripe_customer_id: subscription.customer as string,
        p_plan:
          PLAN_BY_PRICE[subscription.items.data[0].price.id] ?? "free",
        p_status: mapStripeStatus(subscription.status),
        p_stripe_subscription_id: subscription.id,
        p_stripe_price_id: subscription.items.data[0].price.id,
      });
      break;

    case "customer.subscription.deleted":
      await supabaseAdmin.rpc("update_tenant_plan", {
        p_stripe_customer_id: subscription.customer as string,
        p_plan: "free",
        p_status: "cancelled",
        p_stripe_subscription_id: subscription.id,
        p_stripe_price_id: "",
      });
      break;
  }

  return NextResponse.json({ received: true });
}
