import { NextRequest, NextResponse } from "next/server";
import { preferenceClient } from "@/app/libs/mercadopago";
import type { Items } from "mercadopago/dist/clients/commonTypes";
import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type PreferenceItemInput = {
  id?: unknown;
  title?: unknown;
  quantity?: unknown;
  currency_id?: unknown;
  unit_price?: unknown;
};

type PedidoItemRow = {
  idPedido: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number | string;
};

type InvalidPreferenceItem = {
  ok: false;
  error: string;
};

type ValidPreferenceItem = {
  ok: true;
  value: Items;
};

type MappedPreferenceItem = InvalidPreferenceItem | ValidPreferenceItem;

const textOrUndefined = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const isPublicOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    return !["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
};

const getMercadoPagoErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "No se pudo crear la preferencia";
  }

  const possibleCause =
    typeof error === "object" && error && "cause" in error
      ? (error as { cause?: unknown }).cause
      : undefined;

  if (Array.isArray(possibleCause) && possibleCause.length > 0) {
    const firstCause = possibleCause[0];
    if (typeof firstCause === "object" && firstCause) {
      const message =
        "message" in firstCause && typeof firstCause.message === "string"
          ? firstCause.message
          : "description" in firstCause && typeof firstCause.description === "string"
            ? firstCause.description
            : null;
      if (message) {
        return message;
      }
    }
  }

  return error.message || "No se pudo crear la preferencia";
};

const getMercadoPagoErrorDetails = (error: unknown) => {
  if (!(error instanceof Error)) {
    return null;
  }

  const details: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  if (typeof error === "object" && error) {
    if ("cause" in error) {
      details.cause = (error as { cause?: unknown }).cause ?? null;
    }
    if ("stack" in error && typeof error.stack === "string") {
      details.stack = error.stack.split("\n").slice(0, 3).join("\n");
    }
  }

  return details;
};

const mapItem = (item: PreferenceItemInput, index: number): MappedPreferenceItem => {
  const title = textOrUndefined(item.title);
  if (!title) {
    return {
      ok: false as const,
      error: `items[${index}].title es obligatorio`,
    };
  }

  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      ok: false as const,
      error: `items[${index}].quantity debe ser mayor que 0`,
    };
  }

  const unitPrice = Number(item.unit_price);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return {
      ok: false as const,
      error: `items[${index}].unit_price debe ser mayor que 0`,
    };
  }

  return {
    ok: true as const,
    value: {
      id: textOrUndefined(item.id) ?? `item-${index + 1}`,
      title,
      quantity,
      currency_id: textOrUndefined(item.currency_id) ?? "COP",
      unit_price: unitPrice,
    },
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawItems: PreferenceItemInput[] = Array.isArray(body?.items) ? body.items : [];
    const rawIdsPedidos: unknown[] = Array.isArray(body?.idPedidos ?? body?.id_pedidos)
      ? ((body.idPedidos ?? body.id_pedidos) as unknown[])
      : [body?.idPedido ?? body?.id_pedido].filter(
        (value: unknown) => value !== undefined
      );
    const idsPedidos: number[] = Array.from(
      new Set(
        rawIdsPedidos
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      )
    );
    const origin = req.nextUrl.origin;

    if (rawItems.length === 0 && idsPedidos.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Debes enviar items o al menos un idPedido" },
        { status: 400 }
      );
    }

    let validItems: Items[] = [];

    if (rawItems.length > 0) {
      const mappedItems: MappedPreferenceItem[] = rawItems.map(
        (item: PreferenceItemInput, index: number) => mapItem(item ?? {}, index)
      );
      const invalidItem = mappedItems.find(
        (item): item is InvalidPreferenceItem => !item.ok
      );
      if (invalidItem) {
        return NextResponse.json(
          { ok: false, error: invalidItem.error },
          { status: 400 }
        );
      }

      validItems = mappedItems.map(
        (item: MappedPreferenceItem) => (item as ValidPreferenceItem).value
      );
    }

    if (validItems.length === 0 && idsPedidos.length > 0) {
      const { rows } = await sql<PedidoItemRow>(
        `
          SELECT
            dp.id_pedido AS "idPedido",
            p.nombre,
            dp.cantidad,
            dp.precio_unitario AS "precioUnitario"
          FROM public.detalle_pedido AS dp
          INNER JOIN public.producto AS p
            ON p.idproducto = dp.id_producto
          WHERE dp.id_pedido = ANY($1::int[])
          ORDER BY dp.id_pedido ASC, dp.id_detalle_pedido ASC;
        `,
        [idsPedidos]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { ok: false, error: "No se encontraron productos para los pedidos enviados" },
          { status: 404 }
        );
      }

      validItems = rows.map((row, index) => ({
        id: `${row.idPedido}-${index + 1}`,
        title: row.nombre,
        quantity: Number(row.cantidad),
        currency_id: "COP",
        unit_price: Number(row.precioUnitario),
      }));
    }

    const externalReference =
      textOrUndefined(body?.external_reference) ??
      (idsPedidos.length > 0 ? `pedido-${idsPedidos.join("-")}` : undefined);
    const includeBackUrls = isPublicOrigin(origin);
    const preferenceBody: PreferenceRequest = {
      items: validItems,
      external_reference: externalReference,
    };

    if (includeBackUrls) {
      preferenceBody.back_urls = {
        success: `${origin}/user/usuario/compras/exito`,
        failure: `${origin}/user/usuario/compras/fallo`,
        pending: `${origin}/user/usuario/compras/pending`,
      };
      preferenceBody.auto_return = "approved";
    }

    const response = await preferenceClient.create({
      body: preferenceBody,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: response.id ?? null,
          preference_id: response.id ?? null,
          init_point: response.init_point ?? null,
          sandbox_init_point: response.sandbox_init_point ?? null,
          idPedidos: idsPedidos,
          backUrlsIncluidas: includeBackUrls,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/mercadopago/preference]", error);
    return NextResponse.json(
      {
        ok: false,
        error: getMercadoPagoErrorMessage(error),
        details: getMercadoPagoErrorDetails(error),
      },
      { status: 500 }
    );
  }
}
