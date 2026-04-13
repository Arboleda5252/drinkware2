import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { convertToSubcurrency } from "@/app/libs/stripe";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(stripeSecretKey);

type PaymentIntentBody = {
  amount?: number;
  idCliente?: number;
  idPedidos?: number[];
  tipoEntrega?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PaymentIntentBody;
    const amount = Number(body.amount);
    const idCliente = Number(body.idCliente);
    const idPedidos = Array.isArray(body.idPedidos)
      ? Array.from(
          new Set(
            body.idPedidos
              .map((value) => Number(value))
              .filter((value) => Number.isInteger(value) && value > 0)
          )
        )
      : [];
    const tipoEntrega =
      typeof body.tipoEntrega === "string" && body.tipoEntrega.trim().length > 0
        ? body.tipoEntrega.trim()
        : null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Debes enviar un monto valido mayor que 0" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: convertToSubcurrency(amount),
      currency: "cop",
      description:
        idPedidos.length > 0
          ? `Pago pedidos ${idPedidos.join(",")}`
          : "Pago unico de cliente",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: "drinkware-web",
        customerId:
          Number.isInteger(idCliente) && idCliente > 0 ? String(idCliente) : "",
        orderIds: idPedidos.join(","),
        deliveryType: tipoEntrega ?? "",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          clientSecret: paymentIntent.client_secret ?? null,
          paymentIntentId: paymentIntent.id,
          customerId:
            Number.isInteger(idCliente) && idCliente > 0 ? idCliente : null,
          idPedidos,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo crear el PaymentIntent",
      },
      { status: 500 }
    );
  }
}
