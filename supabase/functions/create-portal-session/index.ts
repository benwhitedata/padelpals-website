// Called by a signed-in coach from coach-planner-library.html. Creates a
// Stripe Customer Portal session (cancellations, card updates, invoices)
// and hands back its URL for the browser to redirect to.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.padelpals.app";

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ error: "Not signed in." }, { status: 401 });
    }

    const { data: subscriber, error } = await ctx.supabaseAdmin
      .schema("coaching")
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !subscriber?.stripe_customer_id) {
      return Response.json({ error: "No subscription found for this account." }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscriber.stripe_customer_id,
      return_url: `${siteUrl}/coach-planner-library.html`,
    });

    return Response.json({ url: portalSession.url });
  }),
};
