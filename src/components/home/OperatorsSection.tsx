"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import {
  getOperatorDisplayStatus,
  OPERATOR_STATUS_LABELS,
  OPERATORS,
  type OperatorDisplayStatus,
} from "@/lib/data/operators";

export function OperatorsSection() {
  const [operatorQuery, setOperatorQuery] = useState("");

  const operatorQueryNormalized = operatorQuery.trim().toLowerCase();
  const filteredOperators = OPERATORS.filter((operator) => {
    if (!operatorQueryNormalized) return true;
    const displayStatus = getOperatorDisplayStatus(operator);
    const statusLabel = OPERATOR_STATUS_LABELS[displayStatus].toLowerCase();
    return (
      operator.name.toLowerCase().includes(operatorQueryNormalized) ||
      statusLabel.includes(operatorQueryNormalized)
    );
  }).sort((a, b) => a.name.localeCompare(b.name, "es"));

  const operatorCounts = OPERATORS.reduce(
    (acc, operator) => {
      const displayStatus = getOperatorDisplayStatus(operator);
      acc[displayStatus] += 1;
      return acc;
    },
    { supported: 0, unsupported: 0, pending: 0 } as Record<
      OperatorDisplayStatus,
      number
    >,
  );

  return (
    <section id="operadoras" className="scroll-mt-24 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
            Estado de Operadoras
          </h2>
          <p className="text-zinc-600">
            Listado completo y actualizado de operadoras con su estado de
            integracion.
          </p>
        </div>
        <div className="w-full lg:w-80">
          <label
            htmlFor="operator-search"
            className="text-xs font-semibold text-zinc-500 uppercase tracking-wide"
          >
            Buscar operadora
          </label>
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="operator-search"
              type="text"
              value={operatorQuery}
              onChange={(e) => setOperatorQuery(e.target.value)}
              placeholder="Nombre o estado"
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-y border-zinc-200 py-3 text-xs text-zinc-600">
        <span>Total: {OPERATORS.length}</span>
        <span className="text-emerald-700">
          Soportadas: {operatorCounts.supported}
        </span>
        <span className="text-red-700">
          No soportadas: {operatorCounts.unsupported}
        </span>
        <span className="text-amber-700">
          Pendientes: {operatorCounts.pending}
        </span>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-2 sm:p-3">
        <div className="max-h-[520px] overflow-y-auto pr-1">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOperators.map((operator) => {
              const displayStatus = getOperatorDisplayStatus(operator);
              return (
                <div
                  key={operator.name}
                  className="border border-zinc-200 rounded-xl p-3 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {operator.name}
                      </h3>
                      {operator.reason ? (
                        <p className="text-xs text-zinc-500 mt-1">
                          {operator.reason}
                        </p>
                      ) : null}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-zinc-600">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          displayStatus === "supported"
                            ? "bg-emerald-500"
                            : displayStatus === "unsupported"
                              ? "bg-red-500"
                              : "bg-amber-500"
                        }`}
                      />
                      {OPERATOR_STATUS_LABELS[displayStatus]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredOperators.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">
              No hay resultados con esa busqueda.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
