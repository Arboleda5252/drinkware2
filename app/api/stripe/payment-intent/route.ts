import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { convertToSubcurrency } from "@/app/libs/stripe";
import { sql } from "@/app/Datalibs/database";

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

type PedidoMontoRow = {
  idPedido: number;
  subtotal: number | string;
  costoEnvio: number | string;
  total: number | string;
};

type PagoExistenteRow = {
  idPago: number;
  idPedido: number;
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

    if (idPedidos.length > 0) {
      const { rows: pedidoRows } = await sql<PedidoMontoRow>(
        `
          SELECT
            id_pedido AS "idPedido",
            subtotal,
            costo_envio AS "costoEnvio",
            total
          FROM public.pedido
          WHERE id_pedido = ANY($1::int[]);
        `,
        [idPedidos]
      );

      const montosPorPedido = new Map(
        pedidoRows.map((row) => [
          Number(row.idPedido),
          Number(row.total ?? Number(row.subtotal) + Number(row.costoEnvio)),
        ])
      );

      const { rows: pagosExistentes } = await sql<PagoExistenteRow>(
        `
          SELECT
            id_pago AS "idPago",
            id_pedido AS "idPedido"
          FROM public.pago
          WHERE id_pedido = ANY($1::int[]);
        `,
        [idPedidos]
      );

      const pagosMap = new Map(
        pagosExistentes.map((row) => [Number(row.idPedido), Number(row.idPago)])
      );

      await Promise.all(
        idPedidos.map(async (idPedido) => {
          const monto = montosPorPedido.get(idPedido) ?? 0;
          const observacion = [
            "Stripe PaymentIntent creado",
            Number.isInteger(idCliente) && idCliente > 0 ? `customerId=${idCliente}` : null,
            `orderIds=${idPedidos.join(",")}`,
            tipoEntrega ? `tipoEntrega=${tipoEntrega}` : null,
          ]
            .filter(Boolean)
            .join("; ");

          const idPago = pagosMap.get(idPedido);

          if (idPago) {
            await sql(
              `
                UPDATE public.pago
                SET
                  metodo_pago = $1::varchar(20),
                  estado_pago = $2::varchar(20),
                  monto = $3::numeric(12,2),
                  fecha_pago = NULL,
                  referencia_pago = $4::varchar(100),
                  observacion = $5::text
                WHERE id_pago = $6::integer;
              `,
              ["Stripe", "Pendiente", monto, paymentIntent.id, observacion, idPago]
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
                  NULL,
                  $5::varchar(100),
                  $6::text
                );
            `,
            [idPedido, "Stripe", "Pendiente", monto, paymentIntent.id, observacion]
          );
        })
      );
    }

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
