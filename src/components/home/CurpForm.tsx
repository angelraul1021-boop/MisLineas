"use client";

import {
  AlertCircle,
  ArrowRight,
  Ban,
  ClipboardPaste,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import type React from "react";
import { getCurpValidationError } from "@/lib/curp";
import { cn } from "@/lib/utils";

interface CurpFormProps {
  curp: string;
  setCurp: (v: string) => void;
  loading: boolean;
  error: string | null;
  timedOut: boolean;
  history: string[];
  onSubmit: (e: React.FormEvent) => void;
  onRetry: () => void;
}

export function CurpForm({
  curp,
  setCurp,
  loading,
  error,
  timedOut,
  history,
  onSubmit,
  onRetry,
}: CurpFormProps) {
  const curpValidationError = getCurpValidationError(curp);
  const curpIsValid = curp.length === 18 && !curpValidationError;
  const curpCountColor =
    curp.length === 18 && !curpValidationError
      ? "text-emerald-500"
      : curp.length === 18
        ? "text-red-500"
        : "text-zinc-400";

  const handlePasteCurp = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const sanitized = text
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 18);
      if (sanitized) setCurp(sanitized);
    } catch {}
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-950/5 sm:p-7">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Herramienta principal
            </p>
            <label
              htmlFor="curp-input"
              className="block text-base font-semibold text-zinc-900"
            >
              Ingresa tu CURP para comenzar
            </label>
          </div>
          <label htmlFor="curp-input" className="sr-only">
            Ingresa tu CURP
          </label>
          <div className="relative">
            <input
              type="text"
              id="curp-input"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Ej. XXXX000000XXXXXX00"
              className={cn(
                "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 pr-24 text-base outline-none transition-all placeholder:text-zinc-400",
                "focus:border-black focus:ring-1 focus:ring-black",
                "font-mono uppercase",
                curpValidationError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
                  : "",
              )}
              value={curp}
              onChange={(e) =>
                setCurp(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 18),
                )
              }
              maxLength={18}
              disabled={loading}
              aria-describedby={curpValidationError ? "curp-error" : undefined}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <output
                className={cn(
                  "text-xs font-mono font-medium tabular-nums transition-colors",
                  curpCountColor,
                )}
                aria-label={`${curp.length} de 18 caracteres`}
              >
                {curp.length}/18
              </output>
              {curp.length > 0 && !loading && (
                <button
                  type="button"
                  onClick={() => setCurp("")}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-lg transition-colors"
                  aria-label="Limpiar CURP"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePasteCurp}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-lg transition-colors"
                title="Pegar desde el portapapeles"
                aria-label="Pegar CURP desde portapapeles"
              >
                <ClipboardPaste className="w-4 h-4" />
              </button>
            </div>
          </div>
          {curpValidationError && (
            <p
              id="curp-error"
              className="text-xs text-red-600 font-medium"
              role="alert"
            >
              {curpValidationError}
            </p>
          )}
          <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <p>
              Tu CURP viaja cifrada, <strong>no se guarda</strong> en ninguna
              base de datos y solo se utiliza para la consulta en tiempo real.
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-orange-100 bg-orange-50/80 p-3 text-xs text-orange-800">
            <Ban className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />
            <p>
              <strong>Actualizado: AT&T nos ha bloqueado 5 veces, y contando.</strong> Cada
              vez que encontramos la forma de que pudieras revisar tus propias lineas, ellos
              invierten dinero para volver a bloquearnos. Ahorita ya les ganamos otra vez, pero
              no sabemos cuanto les tome volver a intentarlo. Condenamos ampliamente que una
              empresa dificulte el acceso y haga mas tardado el proceso para que los mexicanos
              puedan saber que numeros telefonicos estan registrados a su nombre. Si en algun
              momento AT&T deja de funcionar aqui, puedes consultarlo
              directamente en{" "}
              <a
                href="https://att.com.mx/controlpersonal/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-orange-900 transition-colors"
              >
                att.com.mx/controlpersonal
              </a>
              .
            </p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <p className="text-zinc-500">
              ¿No recuerdas tu CURP?{" "}
              <a
                href="https://www.gob.mx/curp"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-900 transition-colors"
              >
                Consúltala en gob.mx
              </a>
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">
                Búsquedas recientes:
              </p>
              <span className="text-[10px] text-zinc-400">
                Guardadas solo en tu navegador
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={h}
                  type="button"
                  disabled={loading}
                  onClick={() => setCurp(h)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCurp(h);
                    }
                  }}
                  className="text-xs font-mono px-2.5 py-1 bg-zinc-100/80 text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-200 hover:text-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-100/80 disabled:hover:text-zinc-600"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !curpIsValid}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-black"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validando...</span>
            </>
          ) : (
            <>
              <span>Realizar Consulta</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {(error || timedOut) && (
        <div
          className="mt-4 flex gap-3 text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p>
              {timedOut
                ? "La consulta excedió el tiempo límite. Intenta de nuevo."
                : error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 font-medium underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
