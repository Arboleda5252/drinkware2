"use client";

import * as React from "react";

export default function RegisterForm() {
  const [loading, setLoading] = React.useState(false);
  const [edadError, setEdadError] = React.useState<string>("");
  const [documentValue, setDocumentValue] = React.useState("");
  const [documentError, setDocumentError] = React.useState("");
  const [documentInfo, setDocumentInfo] = React.useState("");
  const [documentChecking, setDocumentChecking] = React.useState(false);
  const [nombre, setNombre] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [direccion, setDireccion] = React.useState("");

  // Restriccion de fecha
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  const maxDate18 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  function validarEdad(input: HTMLInputElement) {
    const v = input.value;
    if (!v) {
      setEdadError("");
      input.setCustomValidity("");
      return;
    }
    const [yy, mm, dd] = v.split("-").map(Number);
    const hoy = new Date();
    let edad = hoy.getFullYear() - yy;
    const mes = hoy.getMonth() + 1;
    const dia = hoy.getDate();
    if (mes < mm || (mes === mm && dia < dd)) edad--;

    if (edad < 18) {
      const msg = "Acceso restringido: solo para mayores de 18 años.";
      setEdadError(msg);
      input.setCustomValidity("Debes ser mayor de 18 años.");
    } else {
      setEdadError("");
      input.setCustomValidity("");
    }
    input.reportValidity();
  }

  const validarDocumento = React.useCallback(
    async (autocompletar = true) => {
      const doc = documentValue.trim();
      if (!doc) {
        setDocumentError("");
        if (autocompletar) {
          setDocumentInfo("");
        }
        return false;
      }

      setDocumentChecking(true);
      setDocumentError("");
      if (autocompletar) {
        setDocumentInfo("");
      }

      const normalize = (value: unknown) => (typeof value === "string" ? value.trim() : "");

      try {
        const usuariosRes = await fetch("/api/usuarios", { cache: "no-store" });
        if (!usuariosRes.ok) {
          throw new Error("No se pudo consultar usuarios");
        }
        const usuariosJson = await usuariosRes.json().catch(() => ({}));
        const usuarios: any[] = Array.isArray(usuariosJson?.data) ? usuariosJson.data : [];
        const existe = usuarios.some((user) => normalize(user.documento) === doc);
        if (existe) {
          setDocumentError("El documento ya está registrado");
          return false;
        }

        if (autocompletar) {
          try {
            const detalleRes = await fetch("/api/Detallepedido", { cache: "no-store" });
            if (!detalleRes.ok) {
              throw new Error("No se pudo consultar el historial de ventas");
            }
            const detalleJson = await detalleRes.json().catch(() => ({}));
            const pedidos: any[] = Array.isArray(detalleJson?.data) ? detalleJson.data : [];
            const match = pedidos.find((pedido) => normalize(pedido.documento) === doc);
            if (match) {
              const nombrePedido = normalize(match.nombreCliente ?? match.nombre_cliente);
              const telefonoPedido = normalize(match.telefonoCliente ?? match.telefono_cliente);
              const direccionPedido = normalize(match.direccionCliente ?? match.direccion_cliente);
              if (nombrePedido) setNombre(nombrePedido);
              if (telefonoPedido) setTelefono(telefonoPedido);
              if (direccionPedido) setDireccion(direccionPedido);
              setDocumentInfo("Datos del cliente completados desde una venta anterior.");
            } else {
              setDocumentInfo("");
            }
          } catch (prefillError) {
            console.error("[Registro] Prefill detalle pedido", prefillError);
            setDocumentInfo("");
          }
        }

        return true;
      } catch (error) {
        console.error("[Registro] Validación de documento", error);
        setDocumentError("No se pudo validar el documento. Intenta nuevamente.");
        return false;
      } finally {
        setDocumentChecking(false);
      }
    },
    [documentValue]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Restriccion menor de edad
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }

    const fd = new FormData(e.currentTarget);

    const documentoValido = await validarDocumento(false);
    if (!documentoValido) {
      (e.currentTarget.elements.namedItem("documento") as HTMLInputElement | null)?.focus();
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      apellido: String(fd.get("apellido") || ""),
      tipo_documento: String(fd.get("tipo_documento") || ""),
      documento: documentValue.trim(),
      correo: String(fd.get("correo_electronico") || ""),
      telefono: telefono.trim(),
      nombreusuario: String(fd.get("nombre_usuario") || ""),
      password: String(fd.get("contrasena") || ""),
      fecha_nacimiento: String(fd.get("fecha_nacimiento") || ""),
      ciudad: String(fd.get("ciudad") || ""),
      direccion: direccion.trim(),
      id_rol: 1,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        const nuevoIdUsuario = Number(
          json.id ?? json?.data?.id ?? json?.user?.idusuario ?? json?.user?.id
        );
        const documentoNormalizado = documentValue.trim();
        if (documentoNormalizado && Number.isInteger(nuevoIdUsuario) && nuevoIdUsuario > 0) {
          try {
            const adoptarRes = await fetch("/api/Detallepedido/adoptar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                documento: documentoNormalizado,
                idUsuario: nuevoIdUsuario,
              }),
            });
            if (!adoptarRes.ok) {
              const adoptarJson = await adoptarRes.json().catch(() => ({}));
              console.warn("[Registro] No se pudieron asociar pedidos previos", adoptarJson);
            }
          } catch (adoptError) {
            console.warn("[Registro] Error al asociar pedidos previos", adoptError);
          }
        }

        alert("Usuario registrado correctamente");
        e.currentTarget.reset();
        setEdadError("");
        setDocumentValue("");
        setDocumentError("");
        setDocumentInfo("");
        setNombre("");
        setTelefono("");
        setDireccion("");
      } else {
        alert(json.error || "Error al registrar usuario");
      }
    } catch (err) {
      alert("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-center">Crear cuenta en DrinkWare</h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-700">
            Tipo de Documento
          </label>
          <select
            id="tipo_documento"
            name="tipo_documento"
            required
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            defaultValue=""
          >
            <option value="" disabled>Selecciona…</option>
            <option value="CC">Cédula de ciudadanía (CC)</option>
            <option value="CE">Cédula de extranjería (CE)</option>
            <option value="PAS">Pasaporte</option>
            <option value="DNI">DNI</option>
          </select>
        </div>

        <div>
          <label htmlFor="documento" className="block text-sm font-medium text-gray-700">
            Documento de Identificación
          </label>
          <input
            id="documento"
            name="documento"
            type="text"
            required
            inputMode="numeric"
            placeholder="Ej 103667890"
            value={documentValue}
            onChange={(event) => {
              setDocumentValue(event.target.value);
              if (documentError) {
                setDocumentError("");
              }
              if (documentInfo) {
                setDocumentInfo("");
              }
            }}
            onBlur={() => {
              void validarDocumento(true);
            }}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {documentChecking && (
            <p className="mt-1 text-xs text-gray-500">Validando documento...</p>
          )}
          {documentError && (
            <p className="mt-1 text-xs font-semibold text-red-600" role="alert">
              {documentError}
            </p>
          )}
          {!documentError && documentInfo && (
            <p className="mt-1 text-xs text-emerald-600">{documentInfo}</p>
          )}
        </div>

        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="given-name"
            placeholder="Nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
            Apellido
          </label>
          <input
            id="apellido"
            name="apellido"
            type="text"
            required
            autoComplete="family-name"
            placeholder="Apellido"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label htmlFor="correo_electronico" className="block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <input
            id="correo_electronico"
            name="correo_electronico"
            type="email"
            required
            autoComplete="email"
            placeholder="tuemail@example.com"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+57 300 000 0000"
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label htmlFor="nombre_usuario" className="block text-sm font-medium text-gray-700">
            Nombre de usuario
          </label>
          <input
            id="nombre_usuario"
            name="nombre_usuario"
            type="text"
            required
            autoComplete="username"
            placeholder="Usuario"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700">
            Fecha de nacimiento
          </label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            required
            max={maxDate18}
            onInput={(e) => validarEdad(e.currentTarget)}
            onChange={(e) => validarEdad(e.currentTarget)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            aria-invalid={Boolean(edadError)}
            aria-describedby={edadError ? "msg-edad" : undefined}
          />

          {edadError && (
            <p
              id="msg-edad"
              role="alert"
              aria-live="polite"
              className="mt-2 text-xs font-semibold text-red-600"
            >
              {edadError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700">
            Ciudad
          </label>
          <input
            id="ciudad"
            name="ciudad"
            type="text"
            required
            autoComplete="address-level2"
            placeholder="Ej. Medellín"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            type="text"
            required
            autoComplete="street-address"
            placeholder="Calle 12 #4-67"
            value={direccion}
            onChange={(event) => setDireccion(event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-gray-900 hover:bg-sky-500 transition shadow-sm disabled:opacity-60"
      >
        {loading ? "Registrando…" : "Registrarse"}
      </button>
    </form>
  );
}