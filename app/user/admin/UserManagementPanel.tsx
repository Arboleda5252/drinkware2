"use client";

import * as React from "react";
import { FaSpinner } from "react-icons/fa";

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string | null;
  documento: string | null;
  rol: string | null;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
};

type Rol = {
  id_rol: number;
  rol: string;
};

const Eye = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const Pencil = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <path d="M12 20h9" stroke="currentColor" strokeWidth="2" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function UserManagementPanel() {
  const [query, setQuery] = React.useState("");
  const [filtroRol, setFiltroRol] = React.useState<string>("Todos");
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalVerAbierto, setModalVerAbierto] = React.useState(false);
  const [usuarioVer, setUsuarioVer] = React.useState<Usuario | null>(null);
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [usuarioEditar, setUsuarioEditar] = React.useState<Usuario | null>(null);
  const [nuevoRolId, setNuevoRolId] = React.useState<number | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [errorModal, setErrorModal] = React.useState<string | null>(null);
  const [rolesDisponibles, setRolesDisponibles] = React.useState<Rol[]>([]);
  const [cargandoRoles, setCargandoRoles] = React.useState(false);

  React.useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        setCargando(true);
        const res = await fetch("/api/usuarios", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "Respuesta invalida");
        if (!cancelado) setUsuarios(json.data as Usuario[]);
      } catch (error: unknown) {
        if (!cancelado) setError(getErrorMessage(error, "Error al cargar usuarios"));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const roles = React.useMemo(() => {
    const set = new Set<string>(usuarios.map((u) => u.rol ?? "Sin rol"));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [usuarios]);

  const filtrados = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return usuarios.filter((u) => {
      const enTexto = [
        u.nombre ?? "",
        u.apellido ?? "",
        u.correo ?? "",
        u.documento ?? "",
        u.rol ?? "Sin rol",
        u.telefono ?? "",
        u.ciudad ?? "",
        u.direccion ?? "",
        u.fecha_nacimiento ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const coincideTexto = q ? enTexto.includes(q) : true;
      const coincideRol = filtroRol === "Todos" ? true : (u.rol ?? "Sin rol") === filtroRol;
      return coincideTexto && coincideRol;
    });
  }, [usuarios, query, filtroRol]);

  const verUsuario = async (u: Usuario) => {
    setUsuarioVer(null);
    setModalVerAbierto(true);

    try {
      const res = await fetch(`/api/usuarios/${u.id}`);
      const json = await res.json();

      if (res.ok && json?.ok && json.data) {
        setUsuarioVer(json.data);
      } else {
        setUsuarioVer(u);
      }
    } catch {
      setUsuarioVer(u);
    }
  };

  const cerrarModalVer = () => {
    setModalVerAbierto(false);
    setUsuarioVer(null);
  };

  const editarUsuario = (u: Usuario) => {
    setUsuarioEditar(u);
    setErrorModal(null);
    setModalAbierto(true);
    setCargandoRoles(true);

    fetch("/api/roles")
      .then((res) => res.json())
      .then((json) => {
        if (json?.ok && Array.isArray(json.data)) {
          setRolesDisponibles(json.data);
          const rolActual = json.data.find((r: Rol) => r.rol === u.rol);
          setNuevoRolId(rolActual ? rolActual.id_rol : null);
        } else {
          setRolesDisponibles([]);
          setNuevoRolId(null);
        }
      })
      .catch(() => {
        setRolesDisponibles([]);
        setNuevoRolId(null);
      })
      .finally(() => setCargandoRoles(false));
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setUsuarioEditar(null);
    setNuevoRolId(null);
    setErrorModal(null);
    setRolesDisponibles([]);
  };

  const guardarRol = async () => {
    if (!usuarioEditar || !nuevoRolId) return;

    setGuardando(true);
    setErrorModal(null);

    try {
      const res = await fetch(`/api/usuarios/${usuarioEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_rol: nuevoRolId }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);

      const rolNombre = rolesDisponibles.find((r) => r.id_rol === nuevoRolId)?.rol ?? "";
      setUsuarios((prev) => prev.map((u) => (u.id === usuarioEditar.id ? { ...u, rol: rolNombre } : u)));
      cerrarModal();
    } catch (error: unknown) {
      setErrorModal(getErrorMessage(error, "Error al actualizar rol"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-8 text-white">
      {modalVerAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative min-w-[320px] max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <button onClick={cerrarModalVer} className="absolute right-4 top-4 text-white/45 transition hover:text-white">
              X
            </button>
            {usuarioVer ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">Detalle</p>
                <h2 className="mb-6 mt-3 text-2xl font-bold tracking-tight">
                  Datos de {usuarioVer.nombre} {usuarioVer.apellido}
                </h2>
                <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Nombre</span>{usuarioVer.nombre}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Apellido</span>{usuarioVer.apellido}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Correo</span>{usuarioVer.correo ?? "-"}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Documento</span>{usuarioVer.documento ?? "-"}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Telefono</span>{usuarioVer.telefono ?? "-"}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Ciudad</span>{usuarioVer.ciudad ?? "-"}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 sm:col-span-2"><span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Direccion</span>{usuarioVer.direccion ?? "-"}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                    <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Fecha de nacimiento</span>
                    {usuarioVer.fecha_nacimiento ? new Date(usuarioVer.fecha_nacimiento).toLocaleDateString() : "-"}
                  </div>
                  {usuarioVer.rol && (
                    <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                      <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Rol</span>
                      {usuarioVer.rol}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin text-xl text-sky-200" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modalAbierto && usuarioEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative min-w-[320px] max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <button onClick={cerrarModal} className="absolute right-4 top-4 text-white/45 transition hover:text-white">
              X
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">Permisos</p>
            <h2 className="mb-4 mt-3 text-2xl font-bold tracking-tight">
              Editar rol de {usuarioEditar.nombre} {usuarioEditar.apellido}
            </h2>
            <div className="mb-4">
              <label htmlFor="select-rol" className="mb-2 block text-sm font-medium text-white/80">
                Nuevo rol:
              </label>
              <select
                id="select-rol"
                value={nuevoRolId ?? ""}
                onChange={(e) => setNuevoRolId(Number(e.target.value))}
                className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/30"
                disabled={guardando || cargandoRoles}
                style={{ colorScheme: "dark" }}
              >
                <option value="" disabled className="bg-slate-950 text-white">
                  Selecciona un rol
                </option>
                {rolesDisponibles.map((r) => (
                  <option key={r.id_rol} value={r.id_rol} className="bg-slate-950 text-white">
                    {r.rol}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-xs leading-6 text-white/60">
                Esta accion puede modificar sus permisos y accesos dentro del sistema.
              </p>
            </div>
            {errorModal && <div className="mb-3 text-sm text-rose-300">{errorModal}</div>}
            <button
              onClick={guardarRol}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-400/15 py-3 font-semibold text-white transition hover:bg-sky-400/25 disabled:opacity-60"
              disabled={guardando || !nuevoRolId}
            >
              {guardando ? "Guardando..." : "Confirmar cambio de rol"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">Administracion</p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Gestion de usuarios</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
              Consulta usuarios, filtra por rol y actualiza permisos.
            </p>
          </div>
        </header>

        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/45 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/25"
            />
          </div>

          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/25"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/20 text-left text-white/65">
                <tr>
                  <th className="px-6 py-3 font-semibold">Nombre</th>
                  <th className="px-6 py-3 font-semibold">Apellido</th>
                  <th className="px-6 py-3 font-semibold">Correo</th>
                  <th className="px-6 py-3 font-semibold">Documento</th>
                  <th className="px-6 py-3 font-semibold">Rol</th>
                  <th className="px-6 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 text-white/85">
                {cargando && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-white/65">
                      <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin text-xl text-sky-200" />
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!cargando && error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-rose-300">
                      {error}
                    </td>
                  </tr>
                )}

                {!cargando &&
                  !error &&
                  filtrados.map((u) => (
                    <tr key={u.id} className="transition hover:bg-white/6">
                      <td className="px-6 py-3">{u.nombre}</td>
                      <td className="px-6 py-3">{u.apellido}</td>
                      <td className="px-6 py-3 text-white/70">{u.correo ?? "-"}</td>
                      <td className="px-6 py-3 text-white/70">{u.documento ?? "-"}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                          {u.rol ?? "Sin rol"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            title="Ver mas informacion"
                            onClick={() => verUsuario(u)}
                            className="rounded-xl border border-white/10 bg-black/20 p-2 text-white/80 transition hover:border-sky-300/30 hover:bg-sky-400/10 hover:text-white"
                          >
                            <Eye />
                          </button>
                          <button
                            title="Actualizar rol"
                            onClick={() => editarUsuario(u)}
                            className="rounded-xl border border-white/10 bg-black/20 p-2 text-white/80 transition hover:border-sky-300/30 hover:bg-sky-400/10 hover:text-white"
                          >
                            <Pencil />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!cargando && !error && filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-white/60">
                      No hay usuarios para &quot;{query}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!cargando && !error && (
          <p className="text-sm text-white/60">
            Mostrando <span className="font-medium">{filtrados.length}</span> de{" "}
            <span className="font-medium">{usuarios.length}</span> usuarios
          </p>
        )}
      </div>
    </section>
  );
}
