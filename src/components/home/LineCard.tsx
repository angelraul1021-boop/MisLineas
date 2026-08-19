"use client";

import { ExternalLink, Flag, MessageSquareWarning, Phone } from "lucide-react";
import { motion } from "motion/react";
import { CopyButton } from "@/components/ui/CopyButton";
import { getProviderWebsite } from "@/lib/data/providerWebsites";
import { cn } from "@/lib/utils";
import type { DisplayLine } from "@/types";

interface Props {
  linea: DisplayLine;
  idx: number;
  onReport: (operadora: string) => void;
}

export function LineCard({ linea, idx, onReport }: Props) {
  const hasVisibleNumber =
    linea.numero !== "Número no confirmado" && linea.numero !== "Número oculto";
  const isConfirmed =
    !linea.isPossible &&
    !linea.isNotFound &&
    !linea.isError &&
    !linea.isUnavailable &&
    hasVisibleNumber;
  const isRegisteredWithoutVisibleNumber =
    !linea.isPossible &&
    !linea.isNotFound &&
    !linea.isError &&
    !linea.isUnavailable &&
    !hasVisibleNumber;
  const website = isConfirmed ? getProviderWebsite(linea.operadora) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, delay: Math.min(idx * 0.04, 0.3) }}
      className="bg-white border border-zinc-200 shadow-sm p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
          <Phone className="w-5 h-5 text-zinc-500" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-0.5">
            <span className="font-semibold text-zinc-900">
              {linea.operadora}
            </span>
            {linea.isPossible ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
                Posible
              </span>
            ) : linea.isNotFound ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> No
                encontrada
              </span>
            ) : linea.isError ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Error
              </span>
            ) : linea.isUnavailable ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> No
                disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                Registrada
              </span>
            )}
          </div>
          <p
            className={cn(
              "font-mono text-base text-zinc-600",
              !hasVisibleNumber && "italic text-sm text-zinc-400",
              (linea.isNotFound || linea.isError || linea.isUnavailable) &&
                "italic text-sm text-zinc-400",
            )}
          >
            {linea.numero}
          </p>
          {linea.disclaimer && (
            <p className="mt-1 max-w-xl text-xs leading-5 text-amber-700">
              {linea.disclaimer}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isConfirmed && <CopyButton text={linea.numero} />}
        {(isConfirmed ||
          linea.isPossible ||
          isRegisteredWithoutVisibleNumber) && (
          <button
            type="button"
            onClick={() => onReport(linea.operadora)}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            aria-label={`Desconocer línea de ${linea.operadora}`}
            title="Desconocer / Derechos ARCO"
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
        {(linea.isError || linea.isNotFound || linea.isUnavailable) && (
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdI1KnQDXHA6lnAD29JZLokvf5NRCeLb_wPuTiDQ1bs8os6_A/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
            aria-label={`Reportar problema con ${linea.operadora}`}
            title="Ayúdenos reportando este problema"
          >
            <MessageSquareWarning className="w-4 h-4" />
          </a>
        )}
        {website && isConfirmed && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            aria-label={`Ir al sitio de ${linea.operadora}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
