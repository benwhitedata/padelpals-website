// Called by a signed-in coach from coach-planner.html. Creates a Stripe
// Checkout Session and hands back its URL for the browser to redirect to.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
// Not set until pricing is decided — see the Coach Planner design doc.
const priceId = Deno.env.get("STRIPE_COACH_PLANNER_PRICE_ID");
const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.padelpals.app";

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    if (!priceId) {
      return Response.json(
        { error: "Coach Planner isn't open for subscriptions yet." },
        { status: 501 },
      );
    }

    const userId = ctx.userClaims?.id;
    const email = ctx.userClaims?.email;
    if (!userId) {
      return Response.json({ error: "Not signed in." }, { status: 401 });
    }

    // Reuse the existing Stripe customer if this account has subscribed
    // before (e.g. resubscribing after a cancellation).
    const { data: existing } = await ctx.supabaseAdmin
      .schema("coaching")
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: userId,
      customer: existing?.stripe_customer_id ?? undefined,
      customer_email: existing?.stripe_customer_id ? undefined : email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${siteUrl}/coach-planner-library.html?checkout=success`,
      cancel_url: `${siteUrl}/coach-planner.html?checkout=cancelled`,
    });

    if (!session.url) {
      return Response.json({ error: "Could not start checkout." }, { status: 500 });
    }

    return Response.json({ url: session.url });
  }),
};
