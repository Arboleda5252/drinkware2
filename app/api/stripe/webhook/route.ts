import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Faltan variables STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "Falta la firma stripe-signature." },
      { status: 400 }
    );
  }

  try {
    const payload = await req.text();
    const stripe = new Stripe(stripeSecretKey);
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = Number(session.metadata?.paymentId ?? "");
      const orderId = Number(session.metadata?.orderId ?? "");
      const paymentReference =
        typeof session.payment_intent === "string" && session.payment_intent.trim().length > 0
          ? session.payment_intent
          : session.id;

      if (Number.isInteger(paymentId) && paymentId > 0) {
        await sql(
          `
            UPDATE public.pago
            SET
              metodo_pago = 'Pago Online',
              estado_pago = 'Pagado',
              fecha_pago = NOW(),
              referencia_pago = $1::varchar(100),
              observacion = $2::text
            WHERE id_pago = $3::integer;
          `,
          [
            paymentReference,
            'Pago realizado con Stripe',
            paymentId,
          ]
        );
      }

      if (Number.isInteger(orderId) && orderId > 0) {
        await sql(
          `
            UPDATE public.pedido
            SET
              estado_pedido = 'Confirmado'
            WHERE id_pedido = $1::integer;
          `,
          [orderId]
        );
      }
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook invalido.",
      },
      { status: 400 }
    );
  }
}
