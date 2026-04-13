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
  metodoPago: string;
  referenciaPago: string | null;
  monto: number | string;
};

type PedidoRow = {
  idPedido: number;
  subtotal: number | string;
  costoEnvio: number | string;
  total: number | string;
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
          id_pedido AS "idPedido",
          metodo_pago AS "metodoPago",
          referencia_pago AS "referenciaPago",
          monto
        FROM public.pago
        WHERE id_pedido = ANY($1::int[]);
      `,
      [orderIds]
    );

    const { rows: pedidos } =
      orderIds.length > 0
        ? await sql<PedidoRow>(
            `
              SELECT
                id_pedido AS "idPedido",
                subtotal,
                costo_envio AS "costoEnvio",
                total
              FROM public.pedido
              WHERE id_pedido = ANY($1::int[]);
            `,
            [orderIds]
          )
        : { rows: [] as PedidoRow[] };

    const montosPorPedido = new Map(
      pedidos.map((row) => [
        Number(row.idPedido),
        Number(row.subtotal),
      ])
    );

    const pagosPorPedido = new Map<number, PagoRow[]>();
    for (const pago of pagos) {
      const pedidoId = Number(pago.idPedido);
      const actuales = pagosPorPedido.get(pedidoId) ?? [];
      actuales.push(pago);
      pagosPorPedido.set(pedidoId, actuales);
    }

    await Promise.all(
      orderIds.map(async (idPedido) => {
        const pagosDelPedido = pagosPorPedido.get(idPedido) ?? [];
        const pagoConservado =
          pagosDelPedido.find((pago) => pago.metodoPago !== "Stripe") ??
          pagosDelPedido.find((pago) => pago.referenciaPago === paymentIntent.id) ??
          pagosDelPedido[0] ??
          null;

        const pagosDuplicados = pagosDelPedido.filter(
          (pago) => pago.idPago !== pagoConservado?.idPago
        );

        if (pagosDuplicados.length > 0) {
          await sql(
            `
              DELETE FROM public.pago
              WHERE id_pago = ANY($1::int[]);
            `,
            [pagosDuplicados.map((pago) => Number(pago.idPago))]
          );
        }

        const metodoPagoFinal =
          paymentIntent.status === "succeeded" ? "Tarjeta" : "Stripe";
        const observacion =
          paymentIntent.status === "succeeded"
            ? "Pago realizado con Stripe"
            : [
                "Stripe confirmado",
                `status=${paymentIntent.status}`,
                `paymentIntentId=${paymentIntent.id}`,
              ].join("; ");

        if (pagoConservado) {
          await sql(
            `
              UPDATE public.pago
              SET
                metodo_pago = $1::varchar(20),
                estado_pago = $2::varchar(20),
                monto = $3::numeric(12,2),
                fecha_pago = $4::timestamp,
                referencia_pago = $5::varchar(100),
                observacion = $6::text
              WHERE id_pago = $7::integer;
            `,
            [
              metodoPagoFinal,
              estadoPago,
              montosPorPedido.get(idPedido) ?? Number(pagoConservado.monto ?? 0),
              fechaPago,
              paymentIntent.id,
              observacion,
              pagoConservado.idPago,
            ]
          );
          return;
        }

        await sql(
          `
            INSERT INTO public.pago
              (
                id_pedido,
                metodo_pago,
                estado_pago,
                monto,
                fecha_pago,
                referencia_pago,
                observacion
              )
            VALUES
              (
                $1::integer,
                $2::varchar(20),
                $3::varchar(20),
                $4::numeric(12,2),
                $5::timestamp,
                $6::varchar(100),
                $7::text
              );
          `,
          [
            idPedido,
            metodoPagoFinal,
            estadoPago,
            montosPorPedido.get(idPedido) ?? 0,
            fechaPago,
            paymentIntent.id,
            observacion,
          ]
        );
      })
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
