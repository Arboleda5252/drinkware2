import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(stripeSecretKey);

type ConfirmPaymentBody = {
  paymentIntentId?: string;
};

type PagoRow = {
  idPago: number;
  idPedido: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ConfirmPaymentBody;
    const paymentIntentId =
      typeof body.paymentIntentId === "string" ? body.paymentIntentId.trim() : "";

    if (!paymentIntentId) {
      return NextResponse.json(
        { ok: false, error: "paymentIntentId es obligatorio" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const orderIds = String(paymentIntent.metadata?.orderIds ?? "")
      .split(",")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
    const tipoEntrega =
      typeof paymentIntent.metadata?.deliveryType === "string" &&
      paymentIntent.metadata.deliveryType.trim().length > 0
        ? paymentIntent.metadata.deliveryType.trim()
        : null;

    const estadoPago =
      paymentIntent.status === "succeeded"
        ? "Pagado"
        : paymentIntent.status === "processing"
          ? "Procesando"
          : "Pendiente";

    const fechaPago =
      paymentIntent.status === "succeeded"
        ? new Date().toISOString()
        : null;

    const { rows: pagos } = await sql<PagoRow>(
      `
        SELECT
          id_pago AS "idPago",
          id_pedido AS "idPedido"
        FROM public.pago
        WHERE referencia_pago = $1::varchar(100);
      `,
      [paymentIntent.id]
    );

    await Promise.all(
      pagos.map((pago) =>
        sql(
          `
            UPDATE public.pago
            SET
              metodo_pago = $1::varchar(20),
              estado_pago = $2::varchar(20),
              fecha_pago = $3::timestamp,
              observacion = $4::text
            WHERE id_pago = $5::integer;
          `,
          [
            paymentIntent.status === "succeeded" ? "Tarjeta" : "Stripe",
            estadoPago,
            fechaPago,
            [
              "Stripe confirmado",
              `status=${paymentIntent.status}`,
              `paymentIntentId=${paymentIntent.id}`,
            ].join("; "),
            pago.idPago,
          ]
        )
      )
    );

    if (paymentIntent.status === "succeeded" && orderIds.length > 0) {
      await Promise.all(
        orderIds.map((idPedido) =>
          sql(
            `
              UPDATE public.pedido
              SET
                tipo_entrega = COALESCE($1::varchar(20), tipo_entrega),
                estado_pedido = 'Confirmado'
              WHERE id_pedido = $2::integer;
            `,
            [tipoEntrega, idPedido]
          )
        )
      );

      await Promise.all(
        orderIds.map((idPedido) =>
          sql(
            `
              UPDATE public.entrega
              SET
                estado_entrega = 'Pendiente'
              WHERE id_pedido = $1::integer;
            `,
            [idPedido]
          )
        )
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        estadoPago,
        idPedidos: orderIds,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo confirmar el pago",
      },
      { status: 500 }
    );
  }
}
