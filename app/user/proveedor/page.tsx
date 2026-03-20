'use client';

import * as React from "react";

const CATEGORIAS = [
  "Aguardiente",
  "Cerveza",
  "Ron",
  "Caldas",
  "Vino",
  "Tequila",
  "Whisky",
  "Brandy",
  "Ginebra",
  "Vodka",
  "otro",
] as const;

export default function Page() {
  const [form, setForm] = React.useState({
    nombre: "",
    categoria: CATEGORIAS[0],
    precio: "",
    descripcion: "",
  });
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [exito, setExito] = React.useState<string | null>(null);
  const [imagenSeleccion, setImagenSeleccion] = React.useState<{
    data: string | null;
    nombre: string | null;
  }>({ data: null, nombre: null });
  const [preview, setPreview] = React.useState<string | null>(null);
  const archivoRef = React.useRef<HTMLInputElement | null>(null);

  const actualizarCampo = (campo: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [campo]: value }));
  };

  const manejarArchivoImagen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }

    const maxSizeMB = 3;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`La imagen debe pesar menos de ${maxSizeMB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      setImagenSeleccion({
        data: dataUrl,
        nombre: file.name,
      });
      setPreview(dataUrl);
      setError(null);
    };
    reader.onerror = () => {
      setError("No se pudo leer el archivo seleccionado.");
    };
    reader.readAsDataURL(file);
  };

  const limpiarImagen = () => {
    setImagenSeleccion({ data: null, nombre: null });
    setPreview(null);
    if (archivoRef.current) {
      archivoRef.current.value = "";
    }
  };

  const enviarFormulario = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setExito(null);

    const nombre = form.nombre.trim();
    const precioNumero = Number(form.precio);
    if (!nombre) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!Number.isFinite(precioNumero) || precioNumero < 0) {
      setError("El precio debe ser un número válido.");
      return;
    }

    setEnviando(true);
    try {
      const imagenPayload = imagenSeleccion.data ?? null;

      const respuesta = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          categoria: form.categoria || null,
          precio: precioNumero,
          descripcion: form.descripcion.trim() || null,
          imagen: imagenPayload,
          stock: 0,
          estados: "No Disponible",
        }),
      });

      const json = await respuesta.json();
      if (!respuesta.ok || !json?.ok) {
        throw new Error(json?.error ?? "Error al crear el producto");
      }

      setExito("Producto creado correctamente.");
      setForm({
        nombre: "",
        categoria: CATEGORIAS[0],
        precio: "",
        descripcion: "",
      });
      setImagenSeleccion({ data: null, nombre: null });
      setPreview(null);
      if (archivoRef.current) {
        archivoRef.current.value = "";
      }
    } catch (err: any) {
      setError(err?.message ?? "No se pudo crear el producto.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-center text-gray-900">Nuevo producto</h1>
        <p className="mt-1 text-sm py-2 text-gray-600">
          Registra un nuevo producto
        </p>
      </header>

      <form
        onSubmit={enviarFormulario}
        className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Nombre</span>
            <input
              type="text"
              value={form.nombre}
              onChange={actualizarCampo("nombre")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: Ron Viejo de Caldas"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Categoría</span>
            <select
              value={form.categoria}
              onChange={actualizarCampo("categoria")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria === "otro" ? "Otro" : categoria}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Precio</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.precio}
              onChange={actualizarCampo("precio")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="0.00"
              required
            />
          </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Imagen (opcional)</span>
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            <input
              ref={archivoRef}
              type="file"
              accept="image/*"
              onChange={manejarArchivoImagen}
              className="text-sm text-gray-700"
            />
            {(imagenSeleccion.nombre || preview) && (
              <div className="flex flex-col gap-2">
                {imagenSeleccion.nombre && (
                  <span className="text-xs text-gray-500">{imagenSeleccion.nombre}</span>
                )}
                {preview && (
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="h-32 w-full rounded-md object-cover shadow-sm"
                  />
                )}
                <button
                  type="button"
                  onClick={limpiarImagen}
                  className="self-start text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Quitar imagen
                </button>
              </div>
            )}
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Descripción</span>
          <textarea
            value={form.descripcion}
            onChange={actualizarCampo("descripcion")}
            className="h-32 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Detalla la información relevante"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
          </p>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {enviando ? "Guardando..." : "Crear producto"}
          </button>
        </div>

        {(error || exito) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {error ?? exito}
          </div>
        )}
        </div>
      </form>
    </main>
  );
}