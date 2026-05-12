"use client";

import * as React from "react";
import { 
  MdInventory2, 
  MdLocalShipping, 
  MdPeople, 
  MdReportProblem, 
  MdRefresh, 
  MdMoreVert,
  MdRadioButtonUnchecked,
  MdCircle
} from "react-icons/md";
import { FaSpinner } from "react-icons/fa";

// --- Tipos ---
type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  stock: number;
  estados: string | null;
};

type PedidoProveedor = {
  id: number;
  producto_id: number;
  cantidad: number;
  estado: string;
  descripcion: string | null;
  creado_en: string;
};

type TabId = "inventario" | "proveedor" | "entregas" | "quejas";

export default function AdminAlertasPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("inventario");
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [pedidosProveedor, setPedidosProveedor] = React.useState<PedidoProveedor[]>([]);
  const [cargando, setCargando] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProd, resPed] = await Promise.all([
          fetch("/api/productos"),
          fetch("/api/productos/productosPedidos")
        ]);
        const dataProd = await resProd.json();
        const dataPed = await resPed.json();
        if (dataProd.ok) setProductos(dataProd.data);
        if (dataPed.ok) setPedidosProveedor(dataPed.data);
      } catch (e) {
        console.error("Error", e);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const alertasInventario = React.useMemo(() => 
    productos.filter(p => p.stock < 20).map(p => ({
      id: `inv-${p.id}`,
      remitente: "Sistema Central",
      asunto: p.stock <= 0 ? `CRÍTICO: ${p.nombre}` : `Stock Bajo: ${p.nombre}`,
      descripcion: `Quedan ${p.stock} unidades en almacén.`,
      fecha: "Ahora",
      urgente: p.stock <= 0,
      color: "text-cyan-400"
    })), [productos]
  );

  const alertasProveedor = React.useMemo(() => 
    pedidosProveedor.map(p => ({
      id: `prov-${p.id}`,
      remitente: "Logística",
      asunto: `Pedido #${p.id} - ${p.estado.toUpperCase()}`,
      descripcion: p.descripcion || "Estado actualizado por el proveedor.",
      fecha: "Hoy",
      urgente: p.estado === "rechazado",
      color: "text-emerald-400"
    })), [pedidosProveedor]
  );

  const tabs = [
    { id: "inventario", label: "Inventario", icon: <MdInventory2 />, activeColor: "text-cyan-400", glow: "shadow-cyan-500/20" },
    { id: "proveedor", label: "Proveedor", icon: <MdPeople />, activeColor: "text-emerald-400", glow: "shadow-emerald-500/20" },
    { id: "entregas", label: "Entregas", icon: <MdLocalShipping />, activeColor: "text-purple-400", glow: "shadow-purple-500/20" },
    { id: "quejas", label: "Quejas", icon: <MdReportProblem />, activeColor: "text-rose-400", glow: "shadow-rose-500/20" },
  ];

  const renderContent = () => {
    let data: any[] = [];
    if (activeTab === "inventario") data = alertasInventario;
    if (activeTab === "proveedor") data = alertasProveedor;
    
    if (data.length === 0) {
      return (
        <div className="py-20 text-center text-slate-500 animate-pulse">
          <p className="text-lg font-light tracking-widest">Bandeja Vacía</p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-slate-800/50">
        {data.map((item) => (
          <li key={item.id} className="group flex items-center px-6 py-3 hover:bg-slate-800/40 cursor-pointer transition-all duration-200">
            <div className="flex items-center gap-4 w-1/4">
              <MdRadioButtonUnchecked className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              <span className={`text-xs font-bold uppercase tracking-wider truncate ${item.urgente ? 'text-rose-500' : 'text-slate-300'}`}>
                {item.remitente}
              </span>
            </div>
            
            <div className="flex-1 truncate pr-8">
              <span className={`text-sm font-medium ${item.urgente ? 'text-white' : 'text-slate-200'}`}>
                {item.asunto}
              </span>
              <span className="text-sm text-slate-500 ml-3 font-light">
                — {item.descripcion}
              </span>
            </div>

            <div className="text-[10px] font-black text-slate-600 w-20 text-right group-hover:text-slate-400 transition-colors uppercase tracking-tighter">
              {item.fecha}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] text-slate-300 font-sans selection:bg-cyan-500/30">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/60 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
            <button className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"><MdRefresh className="h-4 w-4" /></button>
            <button className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"><MdMoreVert className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-tighter">
          Registros: {alertasInventario.length + alertasProveedor.length}
        </div>
      </div>

      <nav className="flex px-4 bg-[#0d1117]/40 border-b border-slate-800/60">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-3 px-8 py-4 text-xs font-bold transition-all duration-300 relative uppercase tracking-widest
                ${isActive ? `${tab.activeColor} bg-slate-800/20` : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/10"}`}
            >
              <span className={`text-lg ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}`}>
                {tab.icon}
              </span>
              {tab.label}
              
              {isActive && (
                <>
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-current ${tab.glow} shadow-lg`} />
                  <MdCircle className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[6px] animate-pulse`} />
                </>
              )}
            </button>
          );
        })}
      </nav>

      <section className="max-w-[1400px] mx-auto mt-2 px-2">
        <div className="bg-[#0d1117]/60 rounded-xl border border-slate-800/50 shadow-2xl overflow-hidden backdrop-blur-sm">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <FaSpinner className="animate-spin text-cyan-500 text-3xl" />
              <span className="text-xs font-bold tracking-[0.3em] text-slate-500 uppercase">Cargando</span>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </section>
    </main>
  );
}