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

type Rol = { id_rol: number; rol: string };

export default function UsersPage() {
  const [query, setQuery] = React.useState("");
  const [filtroRol, setFiltroRol] = React.useState<string>("Todos");
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal para editar rol y usario
  const [modalVerAbierto, setModalVerAbierto] = React.useState(false);
  const [usuarioVer, setUsuarioVer] = React.useState<Usuario | null>(null);
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [usuarioEditar, setUsuarioEditar] = React.useState<Usuario | null>(null);
  const [nuevoRolId, setNuevoRolId] = React.useState<number | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [errorModal, setErrorModal] = React.useState<string | null>(null);
  const [rolesDisponibles, setRolesDisponibles] = React.useState<Rol[]>([]);
  const [cargandoRoles, setCargandoRoles] = React.useState(false);

  // Cargar usuarios del backend
  React.useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        setCargando(true);
        const res = await fetch("/api/usuarios", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "Respuesta inválida");
        if (!cancelado) setUsuarios(json.data as Usuario[]);
      } catch (e: any) {
        if (!cancelado) setError(e?.message ?? "Error al cargar usuarios");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Roles
  const roles = React.useMemo(() => {
    const set = new Set<string>(usuarios.map(u => u.rol ?? "Sin rol"));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [usuarios]);

  // Busqueda
  const filtrados = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return usuarios.filter(u => {
      const enTexto = [
        u.nombre ?? "",
        u.apellido ?? "",
        u.correo ?? "",
        u.documento ?? "",
        u.rol ?? "Sin rol",
        u.telefono ?? "",
        u.ciudad ?? "",
        u.direccion ?? "",
        u.fecha_nacimiento ?? ""
      ].join(" ").toLowerCase();
      const coincideTexto = q ? enTexto.includes(q) : true;
      const coincideRol = filtroRol === "Todos" ? true : (u.rol ?? "Sin rol") === filtroRol;
      return coincideTexto && coincideRol;
    });
  }, [usuarios, query, filtroRol]);

  // Ver información del usuario
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

  // Editar rol del usuario
  const editarUsuario = (u: Usuario) => {
    setUsuarioEditar(u);
    setErrorModal(null);
    setModalAbierto(true);
    setCargandoRoles(true);
    fetch("/api/roles")  
      .then(res => res.json())
      .then(json => {
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
        body: JSON.stringify({ id_rol: nuevoRolId })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      const rolNombre = rolesDisponibles.find(r => r.id_rol === nuevoRolId)?.rol ?? "";
      setUsuarios(prev => prev.map(u => u.id === usuarioEditar.id ? { ...u, rol: rolNombre } : u));
      cerrarModal();
    } catch (e: any) {
      setErrorModal(e?.message ?? "Error al actualizar rol");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {modalVerAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-6 min-w-[320px] max-w-xs relative">
            <button onClick={cerrarModalVer} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">✕</button>
            {usuarioVer ? (
              <>
                <h2 className="text-lg font-bold mb-4">Datos de {usuarioVer.nombre} {usuarioVer.apellido}</h2>
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold">Nombre:</span> {usuarioVer.nombre}</div>
                  <div><span className="font-semibold">Apellido:</span> {usuarioVer.apellido}</div>
                  <div><span className="font-semibold">Correo:</span> {usuarioVer.correo ?? "—"}</div>
                  <div><span className="font-semibold">Documento:</span> {usuarioVer.documento ?? "—"}</div>
                  <div><span className="font-semibold">Telefono:</span> {usuarioVer.telefono ?? "—"}</div>
                  <div><span className="font-semibold">Ciudad:</span> {usuarioVer.ciudad ?? "—"}</div>
                  <div><span className="font-semibold">Dirección:</span> {usuarioVer.direccion ?? "—"}</div>
                  <div><span className="font-semibold">Fecha de nacimiento:</span> {usuarioVer.fecha_nacimiento ? new Date(usuarioVer.fecha_nacimiento).toLocaleDateString() : "—"}</div>
                  {usuarioVer.rol && <div><span className="font-semibold">Rol:</span> {usuarioVer.rol}</div>}
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin text-xl text-gray-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal editar rol */}
      {modalAbierto && usuarioEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-6 min-w-[320px] max-w-xs relative">
            <button onClick={cerrarModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">✕</button>
            <h2 className="text-lg font-bold mb-4">Editar rol de {usuarioEditar.nombre} {usuarioEditar.apellido}</h2>
            <div className="mb-4">
              <label htmlFor="select-rol" className="block text-sm mb-1">Nuevo rol:</label>
              <select
                id="select-rol"
                value={nuevoRolId ?? ''}
                onChange={e => setNuevoRolId(Number(e.target.value))}
                className="w-full rounded border border-gray-300 px-3 py-2"
                disabled={guardando || cargandoRoles}
              >
                <option value="" disabled>Selecciona un rol</option>
                {rolesDisponibles.map(r => (
                  <option key={r.id_rol} value={r.id_rol}>{r.rol}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-600">
                ¿Estás seguro de que deseas cambiar el rol de este usuario? Esta acción puede modificar sus permisos y acceso dentro del sistema.
              </p>
            </div>
            {errorModal && <div className="text-red-600 text-sm mb-2">{errorModal}</div>}
            <button
              onClick={guardarRol}
              className="w-full flex items-center justify-center gap-2 rounded bg-gray-900 text-white py-2 font-semibold hover:bg-sky-500 disabled:opacity-60"
              disabled={guardando || !nuevoRolId}
            >
              {guardando ? (
                "Guardando..."
              ) : (
                <>
                  ✅ Confirmar cambio de rol
                </>
              )}
            </button>
          </div>
        </div>
      )}


      <div className="mx-auto max-w-6xl space-y-6">
        {/* Titulo */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestión de usuarios</h1>         
        </header>

        {/* Buscar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, apellido, correo, documento…"
              className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm outline-none ring-0 focus:border-gray-300 focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla de usuarios */}
        <div className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">Nombre</th>
                  <th className="px-6 py-3 font-semibold">Apellido</th>
                  <th className="px-6 py-3 font-semibold">Correo</th>
                  <th className="px-6 py-3 font-semibold">Documento</th>
                  <th className="px-6 py-3 font-semibold">Rol</th>
                  <th className="px-6 py-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {cargando && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin text-xl text-gray-500" />
                        <span>Cargando…</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!cargando && error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                )}

                {!cargando && !error && filtrados.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-3">{u.nombre}</td>
                    <td className="px-6 py-3">{u.apellido}</td>
                    <td className="px-6 py-3">{u.correo ?? "—"}</td>
                    <td className="px-6 py-3">{u.documento ?? "—"}</td>
                    <td className="px-6 py-3">{u.rol ?? "Sin rol"}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Ver más información"
                          onClick={() => verUsuario(u)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100"
                        >
                          <Eye />
                        </button>
                        <button
                          title="Actualizar rol"
                          onClick={() => editarUsuario(u)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100"
                        >
                          <Pencil />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!cargando && !error && filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No hay usuarios para “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* total de usuarios*/}
        {!cargando && !error && (
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{filtrados.length}</span> de{" "}
            <span className="font-medium">{usuarios.length}</span> usuarios
          </p>
        )}
      </div>
    </main>
  );
}
