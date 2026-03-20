import { BiAngry } from "react-icons/bi";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50 flex px-8 justify-center items-start py-12">
      <div className="max-w-4xl w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
          Métodos de pago
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center items-center">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col items-center">
              <p className="font-semibold text-gray-700">Tarjeta</p>
              <p className="text-sm text-gray-500">Crédito / Débito</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col items-center">
              <p className="font-semibold text-gray-700">Transferencia</p>
              <p className="text-sm text-gray-500">PSE / Banco</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col items-center">
              <p className="font-semibold text-gray-700">Billetera</p>
              <p className="text-sm text-gray-500">Nequi</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
