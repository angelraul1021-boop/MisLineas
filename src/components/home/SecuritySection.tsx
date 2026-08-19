import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  EyeOff,
  Github,
  Lock,
} from "lucide-react";

export function SecuritySection() {
  return (
    <div className="pt-5">
      <div className="grid items-stretch gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">
                Tu información sigue bajo tu control
              </h3>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Usamos tu CURP únicamente para realizar la consulta que
                solicitas. No necesitas registrarte ni crear una cuenta.
              </p>
            </div>
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Conexiones protegidas mediante HTTPS",
              "Historial guardado solo en tu navegador",
              "Sin perfiles ni publicidad personalizada",
              "Resultados con límites claramente indicados",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm leading-5 text-zinc-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>

          <a
            href="https://github.com/moraxh/MisLineas"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:decoration-zinc-900"
          >
            <Github className="h-4 w-4" />
            Revisar el código fuente
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/10">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
              Qué se conserva
            </p>
          </div>
          <div className="divide-y divide-white/10">
            <div className="flex gap-3 px-5 py-4">
              <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium">En nuestros servidores</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  No guardamos tu CURP ni creamos un expediente personal.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
              <div>
                <p className="text-sm font-medium">En tu navegador</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Solo el historial que ves en el formulario, para facilitar
                  consultas posteriores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
