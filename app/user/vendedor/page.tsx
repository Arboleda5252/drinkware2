"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CustomerForm } from "./BuscarDocumento";
import { InventoryModal } from "./Modal_Inventario";
import { OrderSummary } from "./Modal_Venta";
import { PageHeader } from "./PageHeader";
import { ProductSelector } from "./ProductSelector";
import { PaymentLinkModal } from "./PaymentLinkModal";
import type { CartItem, FeedbackState, InventorioProducto } from "./types";

type CheckoutLinkData = {
  pedidoId: number;
  pagoId: number;
  cliente: string;
  total: number;
  checkoutUrl: string;
};

export default function Page() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"Domicilio" | "Retiro_tienda">("Domicilio");
  const [paymentType, setPaymentType] = useState("");
  const [pickupDateTime, setPickupDateTime] = useState("");
  const [customerUserId, setCustomerUserId] = useState<number | null>(null);
  const [documentLookupLoading, setDocumentLookupLoading] = useState(false);
  const [documentLookupError, setDocumentLookupError] = useState("");
  const [documentLookupMessage, setDocumentLookupMessage] = useState("");
  const [customerHasDocument, setCustomerHasDocument] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventorioProductos, setInventorioProductos] = useState<InventorioProducto[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [stockError, setStockError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [vendedorId, setVendedorId] = useState<number | null>(null);
  const [vendedorError, setVendedorError] = useState("");
  const [checkoutLinkData, setCheckoutLinkData] = useState<CheckoutLinkData | null>(null);
  const productSearchRef = useRef<HTMLDivElement | null>(null);
  const productInputRef = useRef<HTMLInputElement | null>(null);

  const seleccionarProducto = useMemo(() => {
    return inventorioProductos.find((product) => product.id === selectedProductId);
  }, [inventorioProductos, selectedProductId]);

  const seleccionarProductoCart = useMemo(() => {
    return cartItems.find((item) => item.productId === selectedProductId)?.quantity ?? 0;
  }, [cartItems, selectedProductId]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const product = inventorioProductos.find((prod) => prod.id === item.productId);
      if (!product) {
        return acc;
      }
      return acc + (product.price ?? 0) * item.quantity;
    }, 0);
  }, [cartItems, inventorioProductos]);

  const pickupMinDateTime = useMemo(() => {
    const ahora = new Date();
    ahora.setSeconds(0, 0);
    const offset = ahora.getTimezoneOffset();
    const local = new Date(ahora.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
  }, []);

  const detalleItems = useMemo(() => {
    return cartItems.map((item) => {
      const product = inventorioProductos.find((prod) => prod.id === item.productId);
      return {
        ...item,
        name: product?.name ?? "Producto",
        price: product?.price ?? 0,
        subtotal: (product?.price ?? 0) * item.quantity,
      };
    });
  }, [cartItems, inventorioProductos]);

  const filtradoInventarioProducts = useMemo(() => {
    const term = inventorySearch.trim().toLowerCase();
    if (!term) {
      return inventorioProductos;
    }
    return inventorioProductos.filter((product) => {
      const name = (product.name ?? "").toLowerCase();
      const description = (product.description ?? "").toLowerCase();
      return name.includes(term) || description.includes(term);
    });
  }, [inventorioProductos, inventorySearch]);

  const handleDocumentModeChange = useCallback((hasDocument: boolean) => {
    setCustomerHasDocument(hasDocument);
    if (!hasDocument) {
      setCustomerDocument("");
      setCustomerUserId(null);
      setCustomerCity("");
      setDocumentLookupError("");
      setDocumentLookupMessage("");
    }
  }, []);

  const formatProductLabel = useCallback((product: InventorioProducto) => {
    const price = product.price ?? 0;
    return `${product.name} - $${price.toLocaleString("es-CO")}`;
  }, []);

  const selectedProductLabel = useMemo(() => {
    return seleccionarProducto ? formatProductLabel(seleccionarProducto) : "";
  }, [seleccionarProducto, formatProductLabel]);

  const { productSearchResults, productSearchHasMore } = useMemo(() => {
    if (!inventorioProductos.length) {
      return {
        productSearchResults: [] as InventorioProducto[],
        productSearchHasMore: false,
      };
    }

    const term = productSearchTerm.trim().toLowerCase();
    const filtered = term
      ? inventorioProductos.filter((product) => {
          const name = (product.name ?? "").toLowerCase();
          const description = (product.description ?? "").toLowerCase();
          return name.includes(term) || description.includes(term);
        })
      : inventorioProductos;

    const limited = filtered.slice(0, 8);
    return {
      productSearchResults: limited,
      productSearchHasMore: filtered.length > limited.length,
    };
  }, [inventorioProductos, productSearchTerm]);

  const handleProductSelection = useCallback((product: InventorioProducto) => {
    if (!product?.id) {
      return;
    }
    setSelectedProductId(product.id);
    setProductSearchTerm("");
    setShowProductSuggestions(false);
    setStockError("");
    setQuantity(null);
  }, []);

  const clearProductSelection = useCallback(() => {
    setSelectedProductId("");
    setProductSearchTerm("");
    setShowProductSuggestions(false);
    setStockError("");
    setQuantity(null);
  }, []);

  const addProduct = () => {
    if (!seleccionarProducto || !selectedProductId || quantity === null || quantity < 1 || stockError) {
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === selectedProductId);
      if (existing) {
        return prev.map((item) =>
          item.productId === selectedProductId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: selectedProductId, quantity }];
    });

    setQuantity(null);
    setFeedback(null);
  };

  const removeCartItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    setFeedback(null);

    if (selectedProductId === productId) {
      setQuantity(null);
      setStockError("");
    }
  }, [selectedProductId]);

  const ajustarStockProducto = useCallback(
    async (
      productoId: number,
      cantidad: number,
      operacion: "disminuir" | "incrementar" = "disminuir"
    ) => {
      const response = await fetch(`/api/productos/${productoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "ajustar_stock",
          cantidad,
          operacion,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error ?? "No fue posible actualizar el stock del producto.");
      }
      return data?.data;
    },
    []
  );

  const fetchInventoryProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      setInventoryLoading(true);
      setInventoryError("");

      const response = await fetch("/api/productos", { signal });
      if (!response.ok) {
        throw new Error("No fue posible cargar el inventario.");
      }

      const payload = await response.json();
      const rawProducts: Record<string, unknown>[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.productos)
          ? payload.productos
          : Array.isArray(payload)
            ? payload
            : [];

      const toText = (value: unknown) =>
        typeof value === "string" || typeof value === "number" ? String(value) : undefined;

      const parsed: InventorioProducto[] = rawProducts
        .filter((product) => (product.estados ?? "Disponible") === "Disponible")
        .map((product) => ({
          id: toText(product.id) ?? toText(product.idproducto) ?? toText(product.nombre),
          name: toText(product.name) ?? toText(product.nombre) ?? "Producto sin nombre",
          price: typeof product.precio === "number" ? product.precio : Number(product.precio) || 0,
          description: toText(product.description) ?? toText(product.descripcion) ?? "",
          stock: typeof product.stock === "number" ? product.stock : Number(product.stock) || 0,
        }));

      setInventorioProductos(parsed);
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      setInventoryError(
        (error as Error).message || "Error cargando el inventario. Intenta de nuevo."
      );
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  const resetSaleForm = useCallback(() => {
    setCartItems([]);
    setQuantity(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerCity("");
    setCustomerDocument("");
    setCustomerAddress("");
    setPaymentType("");
    setPickupDateTime("");
    setCustomerUserId(null);
    setDocumentLookupError("");
    setDocumentLookupMessage("");
  }, []);

  const createCheckoutSession = useCallback(
    async (pedidoId: number, pagoId: number) => {
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, pagoId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "No fue posible generar el link de pago.");
      }

      const checkoutUrl =
        typeof payload?.data?.url === "string" ? payload.data.url.trim() : "";

      if (!checkoutUrl) {
        throw new Error("Stripe no devolvio una URL valida para la sesion.");
      }

      return {
        checkoutUrl,
        sessionId:
          typeof payload?.data?.sessionId === "string" ? payload.data.sessionId : null,
      };
    },
    []
  );

  const registrarVenta = async () => {
    const requiereDatosDomicilio = deliveryType === "Domicilio";
    const faltanDatosBase =
      !customerName ||
      !customerPhone ||
      !customerCity ||
      !customerAddress ||
      cartItems.length === 0;

    if (faltanDatosBase && requiereDatosDomicilio) {
      setFeedback({
        type: "error",
        message: "Completa nombre, telefono, ciudad, direccion y agrega un producto.",
      });
      return;
    }

    if ((!customerName || !customerPhone || cartItems.length === 0) && !requiereDatosDomicilio) {
      setFeedback({
        type: "error",
        message: "Completa nombre, telefono, define la fecha de retiro y agrega un producto.",
      });
      return;
    }

    if (deliveryType === "Retiro_tienda") {
      if (!pickupDateTime) {
        setFeedback({
          type: "error",
          message: "Debes definir la fecha y hora de retiro en tienda.",
        });
        return;
      }

      const retiroSeleccionado = new Date(pickupDateTime);
      if (Number.isNaN(retiroSeleccionado.getTime()) || retiroSeleccionado < new Date()) {
        setFeedback({
          type: "error",
          message: "La fecha y hora de retiro no puede ser anterior a la actual.",
        });
        return;
      }
    }

    if (!vendedorId) {
      setFeedback({
        type: "error",
        message: vendedorError || "No se pudo identificar al vendedor activo.",
      });
      return;
    }

    setRegistering(true);
    setFeedback(null);
    const totalVenta = totalAmount;
    const customerNameValue = customerName.trim();
    const customerPhoneValue = customerPhone.trim();
    const customerCityValue = customerCity.trim();
    const customerAddressValue = customerAddress.trim();
    const paymentTypeValue = paymentType.trim();
    const cliente = customerNameValue;
    const detallesRegistrados: Array<{ productId: number; quantity: number }> = [];
    let pedidoId: number | null = null;

    try {
      const estadoPedido =
        deliveryType === "Retiro_tienda"
          ? "Pendiente"
          : paymentTypeValue === "efectivo"
            ? "Entregado"
            : "Pendiente";
      const paymentTypeLabelMap: Record<string, string> = {
        efectivo: deliveryType === "Retiro_tienda" ? "Pago en tienda" : "Efectivo",
        contraentrega: "Contraentrega",
        pago_online: "Pago Online",
      };
      const paymentTypeLabel = paymentTypeValue
        ? paymentTypeLabelMap[paymentTypeValue] ?? paymentTypeValue
        : null;

      const pedidoPayload: Record<string, unknown> = {
        subtotal: Number(totalVenta),
        costoEnvio: 0,
        tipoEntrega: deliveryType,
        estadoPedido,
      };

      if (Number.isInteger(customerUserId) && customerUserId !== null && customerUserId > 0) {
        pedidoPayload.idCliente = Number(customerUserId);
      }

      const pedidoRes = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoPayload),
      });
      const pedidoData = await pedidoRes.json().catch(() => ({}));
      if (!pedidoRes.ok || !pedidoData?.ok) {
        throw new Error(pedidoData?.error ?? "No fue posible crear el pedido.");
      }

      pedidoId = Number(pedidoData?.data?.idPedido);
      if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        throw new Error("La API de pedidos no devolvio un id_pedido valido.");
      }

      for (const item of cartItems) {
        const product = inventorioProductos.find((prod) => prod.id === item.productId);
        if (!product) {
          throw new Error("Un producto del pedido no existe en el inventario.");
        }

        const numericProductId = Number(product.id);
        if (!Number.isInteger(numericProductId) || numericProductId <= 0) {
          throw new Error("El producto seleccionado no tiene un identificador valido.");
        }

        const cantidad = Number(item.quantity);
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          throw new Error("La cantidad del producto no es valida.");
        }

        const price = Number(product.price ?? 0);
        if (!Number.isFinite(price) || price < 0) {
          throw new Error("El producto seleccionado no tiene un precio valido.");
        }

        const detallePayload: Record<string, unknown> = {
          idPedido: Number(pedidoId),
          idProducto: Number(numericProductId),
          cantidad: Number(cantidad),
          precioUnitario: Number(price),
        };

        let stockReducido = false;
        try {
          await ajustarStockProducto(numericProductId, cantidad, "disminuir");
          stockReducido = true;

          const res = await fetch("/api/detalle_pedido", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(detallePayload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.ok) {
            throw new Error(data?.error ?? "No fue posible registrar el detalle del pedido.");
          }

          detallesRegistrados.push({ productId: numericProductId, quantity: cantidad });
        } catch (detalleError) {
          if (stockReducido) {
            await ajustarStockProducto(numericProductId, cantidad, "incrementar").catch(
              (rollbackError) => {
                console.error(
                  "[Vendedor] No fue posible revertir el stock tras una falla al registrar detalle_pedido",
                  rollbackError
                );
              }
            );
          }

          throw detalleError instanceof Error
            ? detalleError
            : new Error("No fue posible completar el registro del detalle del pedido.");
        }
      }

      const entregaPayload: Record<string, unknown> = {
        idPedido: Number(pedidoId),
        ciudad: deliveryType === "Domicilio" ? customerCityValue : null,
        direccionEntrega: deliveryType === "Domicilio" ? customerAddressValue : null,
        telefonoContacto: customerPhoneValue,
        nombreRecibe: customerNameValue,
        costoEnvio: 0,
        estadoEntrega: "Pendiente",
        observacion: paymentTypeLabel,
        fechaHoraRetiro:
          deliveryType === "Retiro_tienda" ? new Date(pickupDateTime).toISOString() : null,
      };

      const entregaRes = await fetch("/api/entrega", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entregaPayload),
      });
      const entregaData = await entregaRes.json().catch(() => ({}));
      if (!entregaRes.ok || !entregaData?.ok) {
        throw new Error(entregaData?.error ?? "No fue posible crear la entrega.");
      }

      const paymentMethodToPersist =
        paymentTypeValue === "efectivo"
          ? "Pago en Tienda"
          : paymentTypeLabel;

      if (paymentMethodToPersist) {
        const pagoRes = await fetch("/api/pago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idPedido: Number(pedidoId),
            metodoPago: paymentMethodToPersist,
            estadoPago: "Pendiente",
            monto: Number(totalVenta),
            fechaPago: null,
            observacion:
              paymentTypeValue === "pago_online"
                ? "Venta creada por vendedor. Link de pago pendiente de envio."
                : null,
          }),
        });
        const pagoData = await pagoRes.json().catch(() => ({}));
        if (!pagoRes.ok || !pagoData?.ok) {
          throw new Error(pagoData?.error ?? "No fue posible registrar el pago pendiente.");
        }

        if (paymentTypeValue === "pago_online") {
          const pagoId = Number(pagoData?.data?.idPago);
          if (!Number.isInteger(pagoId) || pagoId <= 0) {
            throw new Error("La API de pago no devolvio un id_pago valido.");
          }

          const { checkoutUrl } = await createCheckoutSession(Number(pedidoId), pagoId);

          resetSaleForm();
          setCheckoutLinkData({
            pedidoId: Number(pedidoId),
            pagoId,
            cliente,
            total: totalVenta,
            checkoutUrl,
          });
          setFeedback({
            type: "success",
            message: `Pedido #${pedidoId} registrado`,
          });
          await fetchInventoryProducts();
          return;
        }
      }

      resetSaleForm();
      setFeedback({
        type: "success",
        message: `Pedido #${pedidoId} registrado. Total: $${totalVenta.toLocaleString("es-CO")}`,
      });
      await fetchInventoryProducts();
    } catch (error) {
      for (const detalle of detallesRegistrados) {
        await ajustarStockProducto(detalle.productId, detalle.quantity, "incrementar").catch(
          (rollbackError) => {
            console.error(
              "[Vendedor] No fue posible revertir el stock tras un fallo posterior al registro",
              rollbackError
            );
          }
        );
      }

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? pedidoId && paymentTypeValue === "pago_online"
              ? `${error.message} El pedido #${pedidoId} quedo creado en estado pendiente.`
              : error.message
            : "Error inesperado al registrar la venta.",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleInventoryButtonClick = () => {
    setShowInventoryModal(true);
    if (!inventorioProductos.length && !inventoryLoading) {
      void fetchInventoryProducts();
    }
  };

  const buscarClientePorDocumento = useCallback(async () => {
    if (!customerHasDocument) {
      return;
    }

    const documento = customerDocument.trim();
    if (!documento) {
      setCustomerUserId(null);
      setCustomerCity("");
      setDocumentLookupError("");
      setDocumentLookupMessage("");
      return;
    }

    setDocumentLookupLoading(true);
    setDocumentLookupError("");
    setDocumentLookupMessage("");

    const normalize = (value: unknown) => (typeof value === "string" ? value.trim() : "");

    try {
      const usuariosRes = await fetch("/api/usuarios", { cache: "no-store" });
      if (!usuariosRes.ok) {
        throw new Error("No se pudo consultar los usuarios");
      }

      const usuariosJson = await usuariosRes.json().catch(() => ({}));
      const usuarios: Record<string, unknown>[] = Array.isArray(usuariosJson?.data)
        ? usuariosJson.data
        : [];
      const usuario = usuarios.find((item) => normalize(item.documento) === documento);

      if (usuario) {
        const usuarioId = Number(usuario.id ?? usuario.idusuario);
        setCustomerUserId(Number.isInteger(usuarioId) && usuarioId > 0 ? usuarioId : null);

        const nombreCompleto = [normalize(usuario.nombre), normalize(usuario.apellido)]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (nombreCompleto) {
          setCustomerName((prev) => (prev ? prev : nombreCompleto));
        }

        let detallesCompletados = false;
        if (Number.isInteger(usuarioId) && usuarioId > 0) {
          try {
            const detalleRes = await fetch(`/api/usuarios/${usuarioId}`, { cache: "no-store" });
            if (detalleRes.ok) {
              const detalleJson = await detalleRes.json().catch(() => ({}));
              const detalle = detalleJson?.data;
              if (typeof detalle?.telefono === "string" && detalle.telefono.trim()) {
                setCustomerPhone((prev) => (prev ? prev : detalle.telefono.trim()));
                detallesCompletados = true;
              }
              if (typeof detalle?.ciudad === "string" && detalle.ciudad.trim()) {
                setCustomerCity((prev) => (prev ? prev : detalle.ciudad.trim()));
                detallesCompletados = true;
              }
              if (typeof detalle?.direccion === "string" && detalle.direccion.trim()) {
                setCustomerAddress((prev) => (prev ? prev : detalle.direccion.trim()));
                detallesCompletados = true;
              }
            }
          } catch (detError) {
            console.warn("[Vendedor] No fue posible obtener detalles del usuario", detError);
          }
        }

        setDocumentLookupMessage(
          detallesCompletados
            ? "Usuario registrado encontrado."
            : "Cliente registrado encontrado."
        );
        return;
      }

      setCustomerUserId(null);

      try {
        const pedidosRes = await fetch("/api/Detallepedido", { cache: "no-store" });
        if (pedidosRes.ok) {
          const pedidosJson = await pedidosRes.json().catch(() => ({}));
          const pedidos: Record<string, unknown>[] = Array.isArray(pedidosJson?.data)
            ? pedidosJson.data
            : [];
          const pedido = pedidos.find((item) => normalize(item.documento) === documento);
          if (pedido) {
            const nombrePedido = normalize(pedido.nombreCliente ?? pedido.nombre_cliente);
            const telefonoPedido = normalize(pedido.telefonoCliente ?? pedido.telefono_cliente);
            const direccionPedido = normalize(pedido.direccionCliente ?? pedido.direccion_cliente);
            if (nombrePedido) {
              setCustomerName((prev) => (prev ? prev : nombrePedido));
            }
            if (telefonoPedido) {
              setCustomerPhone((prev) => (prev ? prev : telefonoPedido));
            }
            if (direccionPedido) {
              setCustomerAddress((prev) => (prev ? prev : direccionPedido));
            }
            setDocumentLookupMessage(
              "Cliente no registrado en el sistema. Datos recuperados de historial de compras"
            );
            return;
          }
        }
      } catch (pedidoError) {
        console.warn("[Vendedor] No fue posible consultar pedidos para autocompletar", pedidoError);
      }

      setDocumentLookupMessage("Documento no registrado");
    } catch (error) {
      console.error("[Vendedor] Error buscando documento", error);
      setCustomerUserId(null);
      setDocumentLookupError("No se pudo validar el documento. Intenta de nuevo.");
    } finally {
      setDocumentLookupLoading(false);
    }
  }, [customerDocument, customerHasDocument]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchInventoryProducts(controller.signal);
    return () => controller.abort();
  }, [fetchInventoryProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
        setShowProductSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (inventoryLoading) {
      setShowProductSuggestions(false);
    }
  }, [inventoryLoading]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch("/api/usuarioEstado", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (cancelado) {
          return;
        }

        if (res.ok && json?.user?.idusuario) {
          setVendedorId(Number(json.user.idusuario));
          setVendedorError("");
        } else {
          setVendedorError("No se pudo obtener la informacion del vendedor activo.");
        }
      } catch {
        if (!cancelado) {
          setVendedorError("No se pudo obtener la informacion del vendedor activo.");
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (showInventoryModal) {
      setInventorySearch("");
    }
  }, [showInventoryModal]);

  useEffect(() => {
    if (!selectedProductId) {
      return;
    }
    const exists = inventorioProductos.some((product) => product.id === selectedProductId);
    if (!exists) {
      setSelectedProductId("");
    }
  }, [inventorioProductos, selectedProductId]);

  useEffect(() => {
    if (!seleccionarProducto) {
      setStockError("");
      return;
    }

    const availableStock = seleccionarProducto.stock ?? 0;
    const alreadyAdded = seleccionarProductoCart;
    if (availableStock <= 0) {
      setStockError("Este producto no tiene stock disponible.");
      return;
    }

    const desiredQuantity = quantity ?? 0;
    if (desiredQuantity + alreadyAdded > availableStock) {
      const remaining = Math.max(availableStock - alreadyAdded, 0);
      setStockError(
        remaining > 0
          ? `La cantidad excede el stock disponible. Solo puedes agregar ${remaining} unidad(es) mas.`
          : "Ya has utilizado todo el stock disponible en este pedido."
      );
      return;
    }

    setStockError("");
  }, [seleccionarProducto, quantity, seleccionarProductoCart]);

  useEffect(() => {
    if (deliveryType === "Domicilio" && pickupDateTime) {
      setPickupDateTime("");
    }
  }, [deliveryType, pickupDateTime]);

  useEffect(() => {
    const allowedPaymentTypes =
      deliveryType === "Retiro_tienda"
        ? new Set(["efectivo", "pago_online"])
        : new Set(["contraentrega", "pago_online"]);

    if (paymentType && !allowedPaymentTypes.has(paymentType)) {
      setPaymentType("");
    }
  }, [deliveryType, paymentType]);

  return (
    <section className="relative w-full overflow-hidden bg-black py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/95" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="absolute left-6 top-10 h-28 w-28 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 rounded-[2rem] border border-white/10 bg-white p-8 text-[15px] md:text-base shadow-[0_24px_80px_rgba(2,6,23,0.45)] lg:p-10">
          <PageHeader onOpenInventory={handleInventoryButtonClick} />

          <div className="grid gap-6 md:grid-cols-2">
            <CustomerForm
              customerHasDocument={customerHasDocument}
              customerDocument={customerDocument}
              customerName={customerName}
              customerPhone={customerPhone}
              customerCity={customerCity}
              customerAddress={customerAddress}
              documentLookupLoading={documentLookupLoading}
              documentLookupError={documentLookupError}
              documentLookupMessage={documentLookupMessage}
              onDocumentModeChange={handleDocumentModeChange}
              onCustomerDocumentChange={(value) => {
                setCustomerDocument(value);
                if (documentLookupError) {
                  setDocumentLookupError("");
                }
                if (documentLookupMessage) {
                  setDocumentLookupMessage("");
                }
                setCustomerUserId(null);
              }}
              onDocumentBlur={() => {
                if (customerHasDocument) {
                  void buscarClientePorDocumento();
                }
              }}
              onCustomerNameChange={setCustomerName}
              onCustomerPhoneChange={setCustomerPhone}
              onCustomerCityChange={setCustomerCity}
              onCustomerAddressChange={setCustomerAddress}
            />

            <ProductSelector
              productSearchRef={productSearchRef}
              productInputRef={productInputRef}
              productSearchTerm={productSearchTerm}
              selectedProductId={selectedProductId}
              selectedProductLabel={selectedProductLabel}
              inventoryLoading={inventoryLoading}
              inventoryError={inventoryError}
              stockError={stockError}
              quantity={quantity}
              inventorioProductos={inventorioProductos}
              productSearchResults={productSearchResults}
              productSearchHasMore={productSearchHasMore}
              showProductSuggestions={showProductSuggestions}
              seleccionarProducto={seleccionarProducto}
              seleccionarProductoCart={seleccionarProductoCart}
              onProductSearchTermChange={setProductSearchTerm}
              onShowProductSuggestionsChange={setShowProductSuggestions}
              onSelectedProductIdChange={setSelectedProductId}
              onHandleProductSelection={handleProductSelection}
              onClearProductSelection={clearProductSelection}
              onQuantityChange={setQuantity}
              onAddProduct={addProduct}
            />
          </div>

          <OrderSummary
            detalleItems={detalleItems}
            cartItems={cartItems}
            deliveryType={deliveryType}
            paymentType={paymentType}
            pickupDateTime={pickupDateTime}
            pickupMinDateTime={pickupMinDateTime}
            totalAmount={totalAmount}
            registering={registering}
            vendedorError={vendedorError}
            feedback={feedback}
            onRemoveCartItem={removeCartItem}
            onDeliveryTypeChange={setDeliveryType}
            onPaymentTypeChange={setPaymentType}
            onPickupDateTimeChange={setPickupDateTime}
            onRegisterSale={registrarVenta}
          />
        </div>
      </div>

      {showInventoryModal && (
        <InventoryModal
          inventorySearch={inventorySearch}
          inventoryLoading={inventoryLoading}
          inventoryError={inventoryError}
          inventorioProductos={inventorioProductos}
          filtradoInventarioProducts={filtradoInventarioProducts}
          onClose={() => setShowInventoryModal(false)}
          onInventorySearchChange={setInventorySearch}
          onRetry={() => {
            void fetchInventoryProducts();
          }}
        />
      )}

      {checkoutLinkData && (
        <PaymentLinkModal
          pedidoId={checkoutLinkData.pedidoId}
          pagoId={checkoutLinkData.pagoId}
          cliente={checkoutLinkData.cliente}
          total={checkoutLinkData.total}
          checkoutUrl={checkoutLinkData.checkoutUrl}
          onClose={() => setCheckoutLinkData(null)}
        />
      )}
    </section>
  );
}
