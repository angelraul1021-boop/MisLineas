"use client";

import { Download, Loader2, RotateCcw, UserCheck } from "lucide-react";
import { motion } from "motion/react";
import { TOTAL_PROVIDERS } from "@/lib/data/content";
import { getRiskLevel } from "@/lib/lookup";
import { cn } from "@/lib/utils";
import type { DisplayLine } from "@/types";

interface Props {
  results: DisplayLine[];
  curp: string;
  loading: boolean;
  scannedCount: number;
  queryTime: Date | null;
  onNuevaConsulta: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  exportEnabled: boolean;
  exporting: boolean;
}

export function ResultsHeader({
  results,
  curp,
  loading,
  scannedCount,
  queryTime,
  onNuevaConsulta,
  onExportCsv,
  onExportJson,
  exportEnabled,
  exporting,
}: Props) {
  const detectedCount = results.filter(
    (l) => !l.isNotFound && !l.isError && !l.isUnavailable,
  ).length;
  const riskLevel = getRiskLevel(results);

  return (
    <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-zinc-900">
              {detectedCount}{" "}
              {detectedCount === 1 ? "Línea detectada" : "Líneas detectadas"}
            </h2>
            {loading && (
              <span className="flex items-center justify-center text-zinc-500 text-xs font-medium gap-1.5 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />{" "}
                Consultando
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-zinc-600 text-sm font-mono bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 w-fit">
            <UserCheck className="w-4 h-4" />
            <span>{curp}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            disabled={!exportEnabled || exporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            type="button"
            onClick={onExportJson}
            disabled={!exportEnabled || exporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> JSON
          </button>
          <button
            type="button"
            onClick={onNuevaConsulta}
            className="text-sm font-medium text-zinc-500 hover:text-black flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Nueva consulta
          </button>
        </div>
      </div>

      {loading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500 font-medium">
              Escaneando proveedores...
            </span>
            <span className="text-xs font-mono font-semibold text-zinc-700">
              {scannedCount}/{TOTAL_PROVIDERS}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-zinc-900 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((scannedCount / TOTAL_PROVIDERS) * 100, 100)}%`,
              }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">
              Estatus de riesgo
            </p>
            <p className="text-base font-bold text-zinc-900">
              {riskLevel.label}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              {riskLevel.description}
            </p>
          </div>
          <div className={cn("w-3 h-3 rounded-full", riskLevel.color)} />
        </div>
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
          <p className="text-xs text-zinc-500 font-medium mb-1">
            Hora de consulta
          </p>
          <p className="text-base font-bold text-zinc-900">
            {queryTime?.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-600">
          ¿Por qué este estatus?
        </span>{" "}
        {riskLevel.reason} Es una guía basada solo en esta consulta, no una
        confirmación de fraude.
      </p>
    </div>
  );
}
