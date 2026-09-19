// Stripe webhook. Verifies the signature itself — Stripe doesn't send a
// Supabase key, so this runs with auth: "none" and verify_jwt = false.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

// Stripe moved current_period_end from the Subscription object onto each
// SubscriptionItem in newer API versions. Read whichever shape is present.
function periodEndFromSubscription(subscription: Stripe.Subscription): string | null {
  // deno-lint-ignore no-explicit-any
  const topLevel = (subscription as any).current_period_end;
  if (typeof topLevel === "number") return new Date(topLevel * 1000).toISOString();

  const item = subscription.items?.data?.[0];
  // deno-lint-ignore no-explicit-any
  const itemLevel = item && (item as any).current_period_end;
  if (typeof itemLevel === "number") return new Date(itemLevel * 1000).toISOString();

  return null;
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const signature = req.headers.get("stripe-signature") ?? "";
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Stripe signature verification failed", err);
      return new Response("bad signature", { status: 400 });
    }

    // Idempotency: Stripe redelivers events, so claim the event id first.
    // A unique-violation here means we've already processed it.
    const { error: dedupeError } = await ctx.supabaseAdmin
      .schema("coaching")
      .from("stripe_events")
      .insert({ id: event.id, type: event.type });

    if (dedupeError) {
      if (dedupeError.code === "23505") {
        return Response.json({ received: true, duplicate: true });
      }
      console.error("Failed to record stripe event", dedupeError);
      return new Response("db error", { status: 500 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

        if (!userId || !customerId) {
          console.error("checkout.session.completed missing client_reference_id or customer", session.id);
          break;
        }

        let status = "active";
        let periodEnd: string | null = null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          status = subscription.status;
          periodEnd = periodEndFromSubscription(subscription);
        }

        const { error } = await ctx.supabaseAdmin
          .schema("coaching")
          .from("subscribers")
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId ?? null,
            status,
            current_period_end: periodEnd,
          }, { onConflict: "user_id" });

        if (error) console.error("Failed to upsert subscriber", error);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const { error } = await ctx.supabaseAdmin
          .schema("coaching")
          .from("subscribers")
          .update({
            status: subscription.status,
            current_period_end: periodEndFromSubscription(subscription),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) console.error("Failed to update subscriber", error);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // Leave current_period_end alone — access runs to the end of the
        // paid period, per the design doc.
        const { error } = await ctx.supabaseAdmin
          .schema("coaching")
          .from("subscribers")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) console.error("Failed to cancel subscriber", error);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        // Stripe retries on its own schedule — don't revoke on first failure.
        const { error } = await ctx.supabaseAdmin
          .schema("coaching")
          .from("subscribers")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (error) console.error("Failed to mark subscriber past_due", error);
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  }),
};
