import RegisterForm from "./registerForm";

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[url(/img/vino.jpg)] bg-cover bg-center opacity-30 -z-10"></div>
      <main className="relative min-h-screen flex items-center justify-center p-6">
        <section className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
          <RegisterForm />
        </section>
      </main>
    </div>
  );
}