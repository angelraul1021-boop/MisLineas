import { Database, FileX, Search } from "lucide-react";
import { WHY_CARDS } from "@/lib/data/content";

export function WhySection() {
  return (
    <div className="space-y-10 pt-4">
      <section className="grid sm:grid-cols-3 gap-6">
        <div className="sm:col-span-3 mb-2">
          <p className="text-zinc-600">
            Las compañías de telefonía tienen plataformas separadas. MisLíneas
            te ayuda a reunir sus respuestas, sin ocultar cuándo una consulta
            requiere revisión manual.
          </p>
        </div>
        {WHY_CARDS.map((card) => (
          <div
            key={card.title}
            className="bg-zinc-50 border border-zinc-200 p-6 rounded-2xl"
          >
            <card.icon className="w-6 h-6 text-black mb-4" />
            <h3 className="font-semibold text-zinc-900 mb-2">{card.title}</h3>
            <p className="text-sm text-zinc-600">{card.body}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">
            ¿Cómo funciona por debajo?
          </h2>
          <p className="text-zinc-600 text-sm">
            Explicamos cada paso para que puedas distinguir entre una línea no
            encontrada y una operadora que no pudo ser consultada.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-[2px] bg-zinc-200" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white border-2 border-zinc-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Search className="w-8 h-8 text-black" />
            </div>
            <h3 className="font-bold text-zinc-900 mb-2">
              1. Ingresas tu CURP
            </h3>
            <p className="text-xs text-zinc-600 max-w-[200px]">
              La CURP se usa como dato de consulta y se transmite mediante una
              conexión segura.
            </p>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white border-2 border-zinc-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Database className="w-8 h-8 text-black" />
            </div>
            <h3 className="font-bold text-zinc-900 mb-2">
              2. Consultamos plataformas
            </h3>
            <p className="text-xs text-zinc-600 max-w-[200px]">
              Intentamos las consultas disponibles de las operadoras, sin
              presentar a MisLíneas como una autoridad.
            </p>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white border-2 border-zinc-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <FileX className="w-8 h-8 text-black" />
            </div>
            <h3 className="font-bold text-zinc-900 mb-2">
              3. Resultados con contexto
            </h3>
            <p className="text-xs text-zinc-600 max-w-[200px]">
              Te mostramos las líneas, las respuestas sin coincidencias y las
              operadoras que requieren una revisión adicional.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
