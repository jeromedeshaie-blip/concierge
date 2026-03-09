"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/plans";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function createCheckoutSession(plan: "pro" | "business") {
  const stripe = getStripe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, full_name, tenants(stripe_customer_id, name)")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenant = profile?.tenants as any;
  const priceId = PLANS[plan].priceId;
  if (!priceId) throw new Error("Prix non configuré");

  let customerId: string | undefined = tenant?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: tenant?.name ?? profile?.full_name ?? "",
      metadata: { tenant_id: profile?.tenant_id ?? "" },
    });
    customerId = customer.id;

    await supabase
      .from("tenants")
      .update({ stripe_customer_id: customerId })
      .eq("id", profile?.tenant_id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: {
      trial_period_days: 14,
    },
  });

  redirect(session.url!);
}

export async function createPortalSession() {
  const stripe = getStripe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenants(stripe_customer_id)")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerId = (profile?.tenants as any)?.stripe_customer_id;
  if (!customerId) throw new Error("Pas de compte Stripe");

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  redirect(session.url);
}
