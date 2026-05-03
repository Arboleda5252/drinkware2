import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/app/Datalibs/database";
import { convertToSubcurrency } from "@/app/libs/stripe";

export const runtime = "nodejs";

type CheckoutSessionBody = {
  pedidoId?: number;
  pagoId?: number;
};

type PagoPedidoRow = {
  idPago: number;
  idPedido: number;
  metodoPago: string;
  estadoPago: string;
  monto: number | string;
  total: number | string;
  tipoEntrega: string | null;
  fechaHoraRetiro: string | null;
  nombreRecibe: string | null;
};

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { ok: false, error: "STRIPE_SECRET_KEY no esta configurada." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as CheckoutSessionBody;
    const pedidoId = Number(body?.pedidoId);
    const pagoId = Number(body?.pagoId);

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return NextResponse.json(
        { ok: false, error: "pedidoId debe ser un entero positivo." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(pagoId) || pagoId <= 0) {
      return NextResponse.json(
        { ok: false, error: "pagoId debe ser un entero positivo." },
        { status: 400 }
      );
    }

    const { rows } = await sql<PagoPedidoRow>(
      `
        SELECT
          pg.id_pago AS "idPago",
          pg.id_pedido AS "idPedido",
          pg.metodo_pago AS "metodoPago",
          pg.estado_pago AS "estadoPago",
          pg.monto,
          pd.total,
          pd.tipo_entrega AS "tipoEntrega",
          en.fecha_hora_retiro AS "fechaHoraRetiro",
          en.nombre_recibe AS "nombreRecibe"
        FROM public.pago pg
        INNER JOIN public.pedido pd ON pd.id_pedido = pg.id_pedido
        LEFT JOIN public.entrega en ON en.id_pedido = pd.id_pedido
        WHERE pg.id_pago = $1::integer
          AND pg.id_pedido = $2::integer
        LIMIT 1;
      `,
      [pagoId, pedidoId]
    );

    const pagoPedido = rows[0];
    if (!pagoPedido) {
      return NextResponse.json(
        { ok: false, error: "No se encontro el pago asociado al pedido." },
        { status: 404 }
      );
    }

    if (pagoPedido.metodoPago !== "Pago Online") {
      return NextResponse.json(
        { ok: false, error: "El pago debe estar registrado como Pago Online." },
        { status: 400 }
      );
    }

    if (pagoPedido.estadoPago === "Pagado") {
      return NextResponse.json(
        { ok: false, error: "Este pago ya fue confirmado anteriormente." },
        { status: 409 }
      );
    }

    const amount = Number(pagoPedido.monto) > 0 ? Number(pagoPedido.monto) : Number(pagoPedido.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "El monto del pedido no es valido para Stripe." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const baseUrl =
      process.env.APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      req.nextUrl.origin;

    const successUrl = new URL("/checkout/success", baseUrl);
    successUrl.searchParams.set("pedido", String(pedidoId));

    const cancelUrl = new URL("/checkout/cancel", baseUrl);
    cancelUrl.searchParams.set("pedido", String(pedidoId));

    const metadata = {
      source: "vendedor",
      orderId: String(pedidoId),
      paymentId: String(pagoId),
      paymentMethod: "Pago Online",
      deliveryType: pagoPedido.tipoEntrega ?? "",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cop",
            unit_amount: convertToSubcurrency(amount),
            product_data: {
              name: `Pedido #${pedidoId}`,
              description:
                pagoPedido.tipoEntrega === "Retiro_tienda" && pagoPedido.fechaHoraRetiro
                  ? `Retiro programado para ${new Date(pagoPedido.fechaHoraRetiro).toLocaleString("es-CO")}`
                  : "Venta registrada por vendedor",
            },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        metadata,
      },
      locale: "es",
    });

    await sql(
      `
        UPDATE public.pago
        SET
          referencia_pago = $1::varchar(100),
          observacion = $2::text
        WHERE id_pago = $3::integer;
      `,
      [
        session.id,
        "Checkout Session creada desde vendedor. Esperando confirmacion del webhook.",
        pagoId,
      ]
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          url: session.url,
          sessionId: session.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No fue posible crear la sesion de Stripe Checkout.",
      },
      { status: 500 }
    );
  }
}
