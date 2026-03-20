"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdOutlineDeleteForever } from "react-icons/md";

type UsuarioFormState = {
  nombre: string;
  apellido: string;
  documento: string;
  fecha_nacimiento: string;
  telefono: string;
  correo: string;
  ciudad: string;
  direccion: string;
  password: string;
};

type UsuarioApiData = {
  nombre: string | null;
  apellido: string | null;
  documento: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  correo: string | null;
  ciudad: string | null;
  direccion: string | null;
};

type UsuarioApiResponseEnvelope = {
  ok: boolean;
  data?: UsuarioApiData;
  error?: string;
};

// Campos editables
const editableFields: Array<keyof Omit<UsuarioFormState, "password">> = [
  "nombre",
  "apellido",
  "telefono",
  "correo",
  "ciudad",
  "direccion",
];

// Formulario vacio
function createEmptyFormData(): UsuarioFormState {
  return {
    nombre: "",
    apellido: "",
    documento: "",
    fecha_nacimiento: "",
    telefono: "",
    correo: "",
    ciudad: "",
    direccion: "",
    password: "",
  };
}

function formatDateForInput(value: string | null): string {
  if (!value) {
    return "";
  }

  const directMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (directMatch) {
    return directMatch[0];
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function mapApiDataToForm(data: UsuarioApiData): UsuarioFormState {
  return {
    nombre: data.nombre ?? "",
    apellido: data.apellido ?? "",
    documento: data.documento ?? "",
    fecha_nacimiento: formatDateForInput(data.fecha_nacimiento),
    telefono: data.telefono ?? "",
    correo: data.correo ?? "",
    ciudad: data.ciudad ?? "",
    direccion: data.direccion ?? "",
    password: "",
  };
}

export default function Page() {
  const router = useRouter();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState<UsuarioFormState>(() => createEmptyFormData());
  const [baselineData, setBaselineData] = useState<UsuarioFormState | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Datos de usuario
  const userData = useCallback(async () => {
    setIsLoadingUser(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/usuarios/me", {
        credentials: "include",
      });
      const payload: UsuarioApiResponseEnvelope | null = await response
        .json()
        .catch(() => null);

      if (!response.ok || !payload?.ok || !payload.data) {
        const message = payload?.error ?? `Error ${response.status}`;
        throw new Error(message);
      }

      const mapped = mapApiDataToForm(payload.data);
      setBaselineData(mapped);
      setFormData({ ...mapped });
      setSaveError(null);
      setSaveSuccess(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudo ver la informacion de la cuenta."
      );
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (!showAccountModal) {
      return;
    }
    userData();
  }, [showAccountModal, userData]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name as keyof UsuarioFormState]: value,
    }));
  };

  const handleCloseAccountModal = () => {
    setShowAccountModal(false);
    setSaveError(null);
    setSaveSuccess(null);
    setFormData((prev) => ({
      ...prev,
      password: "",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!baselineData) {
      return;
    }

    const updates: Record<string, string> = {};
    for (const field of editableFields) {
      const newValue = formData[field].trim();
      const oldValue = baselineData[field].trim();
      if (newValue !== oldValue) {
        updates[field] = newValue;
      }
    }

    const newPassword = formData.password.trim();
    if (newPassword) {
      updates.password = newPassword;
    }

    if (Object.keys(updates).length === 0) {
      setSaveError(null);
      setSaveSuccess("No hay cambios para guardar.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await fetch("/api/usuarios/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      const payload: UsuarioApiResponseEnvelope | null = await response
        .json()
        .catch(() => null);

      if (!response.ok || !payload?.ok) {
        const message = payload?.error ?? `Error ${response.status}`;
        throw new Error(message);
      }

      const updatedBaseline: UsuarioFormState = {
        ...baselineData,
        password: "",
      };

      for (const field of editableFields) {
        if (updates[field] !== undefined) {
          updatedBaseline[field] = updates[field];
        }
      }

      setBaselineData(updatedBaseline);
      setFormData({ ...updatedBaseline });
      setSaveSuccess("Datos actualizados correctamente.");
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la cuenta."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full text-white">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold text-black">Panel de usuario</h1>
        <p className="text-slate-900">
          Administra tu cuenta desde aqui.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <button
            onClick={() => setShowAccountModal(true)}
            className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-medium text-black shadow-sm ring-1 ring-gray-200 hover:bg-sky-300"
          >
            Administrar cuenta
          </button>

          <Link
            href="/user/usuario/pago"
            className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-medium text-black shadow-sm ring-1 ring-gray-200 hover:bg-sky-300"
          >
            Metodo de pago
          </Link>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-medium text-black shadow-sm ring-1 ring-gray-200 hover:bg-red-300"
          >
            Eliminar cuenta
          </button>
        </div>
      </div>

      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 text-left text-slate-900 shadow-lg">
            <h2 className="text-center text-xl font-semibold">
              Administrar cuenta
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Aqui puedes consultar y editar los datos de tu cuenta.
            </p>

            {isLoadingUser ? (
              <p className="mt-6 text-center text-sm text-slate-500">
                Cargando informacion...
              </p>
            ) : loadError ? (
              <div className="mt-6 space-y-4">
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {loadError}
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={userData}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Reintentar
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseAccountModal}
                    className="ml-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : !baselineData ? (
              <div className="mt-6 space-y-4">
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  No se encontraron datos de usuario.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseAccountModal}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {saveError && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {saveError}
                  </p>
                )}
                {saveSuccess && (
                  <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {saveSuccess}
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="nombre"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      autoComplete="given-name"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="apellido"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Apellido
                    </label>
                    <input
                      id="apellido"
                      name="apellido"
                      type="text"
                      autoComplete="family-name"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-700">
                      Documento
                    </span>
                    <p className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
                      {formData.documento || "Sin documento registrado"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-700">
                      Fecha de nacimiento
                    </span>
                    <p className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
                      {formData.fecha_nacimiento || "Sin fecha registrada"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="telefono"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Telefono
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      autoComplete="tel"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="correo"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="correo"
                      name="correo"
                      type="email"
                      autoComplete="email"
                      value={formData.correo}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="ciudad"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Ciudad
                    </label>
                    <input
                      id="ciudad"
                      name="ciudad"
                      type="text"
                      autoComplete="address-level2"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="direccion"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Dirección
                    </label>
                    <input
                      id="direccion"
                      name="direccion"
                      type="text"
                      autoComplete="street-address"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ingresa una nueva contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <p className="text-xs text-slate-500">
                    Campo vacio si no deseas cambiar la contraseña
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseAccountModal}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-left text-slate-900 shadow-lg">
            <h2 className="text-xl font-semibold text-red-600">
              Confirmar eliminacion
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Esta accion eliminara permanentemente tu cuenta. Seguro que deseas
              continuar?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/usuarios/me", {
                      method: "DELETE",
                      credentials: "include",
                    });
                    if (!res.ok) {
                      const json = await res.json().catch(() => ({}));
                      throw new Error(
                        (json as { error?: string })?.error ?? `HTTP ${res.status}`
                      );
                    }
                    setShowDeleteModal(false);
                    router.push("/");
                    router.refresh();
                  } catch (err) {
                    console.error(err);
                    alert("No se pudo eliminar la cuenta. Intenta nuevamente.");
                  }
                }}
                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-white hover:bg-red-200"
              >
                <MdOutlineDeleteForever className="text-2xl text-red-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}