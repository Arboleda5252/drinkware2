import { notFound } from "next/navigation";
import { getUserFromSession } from "@/app/Datalibs/auth";
import PedidoDetalleClient from "./PedidoDetalleClient";

export const metadata = { title: "Detalle del pedido" };

type Params = { params: Promise<{ pedidoId: string }> };

export default async function Page({ params }: Params) {
  const { pedidoId: rawPedidoId } = await params;
  const pedidoId = Number(rawPedidoId);

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    notFound();
  }

  const sessionUser = await getUserFromSession();
  if (!sessionUser || sessionUser.idusuario <= 0) {
    notFound();
  }

  if ((sessionUser.rol ?? "").toLowerCase() !== "domiciliario") {
    notFound();
  }

  return <PedidoDetalleClient pedidoId={pedidoId} currentUserId={sessionUser.idusuario} />;
}
