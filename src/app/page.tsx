"use client";

import { AlertTriangle } from "lucide-react";
import { AnimatePresence } from "motion/react";
import type React from "react";
import { useState } from "react";
import { AccordionItem } from "@/components/home/AccordionItem";
import { ArcoSection } from "@/components/home/ArcoSection";
import { CurpForm } from "@/components/home/CurpForm";
import { EmptyState } from "@/components/home/EmptyState";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Navbar } from "@/components/home/Navbar";
import { Notices } from "@/components/home/Notices";
import { OperatorsSection } from "@/components/home/OperatorsSection";
import { ResultsPanel } from "@/components/home/ResultsPanel";
import { SecuritySection } from "@/components/home/SecuritySection";
import { WhySection } from "@/components/home/WhySection";
import { ReportDialog } from "@/components/ui/ReportDialog";
import { getCurpValidationError } from "@/lib/curp";
import { useCurpHistory } from "@/lib/hooks/useCurpHistory";
import { useLookup } from "@/lib/hooks/useLookup";

export default function MisLineas() {
  const [curp, setCurp] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const { history, saveToHistory } = useCurpHistory();
  const {
    loading,
    timedOut,
    error,
    results,
    queryTime,
    scannedCount,
    liveMessage,
    consultar,
    retry,
    reset,
  } = useLookup(saveToHistory);

  const curpValidationError = getCurpValidationError(curp);
  const curpIsValid = curp.length === 18 && !curpValidationError;

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curpIsValid) return;
    consultar(curp);
  };

  const handleNuevaConsulta = () => {
    reset();
    setCurp("");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafaf9_0%,#f4f4f5_40%,#ffffff_100%)] font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <div className="flex items-center justify-center gap-3 border-b border-amber-300/60 bg-[linear-gradient(90deg,#d97706_0%,#b45309_100%)] px-4 py-3 text-sm text-white">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p className="text-center max-w-4xl font-medium">
          <strong>Aviso Telcel.</strong> En algunos casos, una línea Telcel
          puede no aparecer ni aquí ni en el portal oficial, incluso cuando el
          usuario cree que ya la registró. Esto puede significar que la línea no
          quedó bien vinculada o que hubo un fallo de Telcel, así que conviene
          revisarlo con cuidado en{" "}
          <a
            href="https://registro.telcel.com/vinculatulinea/#/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-amber-100"
          >
            registro.telcel.com/vinculatulinea
          </a>
          .
        </p>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <AnimatePresence>
        {reportTarget && (
          <ReportDialog
            operadora={reportTarget}
            onClose={() => setReportTarget(null)}
          />
        )}
      </AnimatePresence>

      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <section className="mx-auto max-w-3xl space-y-6">
          <Hero />
          <CurpForm
            curp={curp}
            setCurp={setCurp}
            loading={loading}
            error={error}
            timedOut={timedOut}
            history={history}
            onSubmit={handleConsultar}
            onRetry={retry}
          />
          <Notices />
        </section>

        <section className="mx-auto mt-8 max-w-5xl">
          <AnimatePresence mode="wait">
            {!results && !loading && !timedOut ? (
              <EmptyState />
            ) : results !== null ? (
              <ResultsPanel
                results={results}
                curp={curp}
                loading={loading}
                scannedCount={scannedCount}
                queryTime={queryTime}
                onNuevaConsulta={handleNuevaConsulta}
                onReport={setReportTarget}
              />
            ) : null}
          </AnimatePresence>
        </section>

        <div className="mt-20 space-y-12">
          <OperatorsSection />

          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 mb-6 px-2 text-center md:text-left">
              Centro de Información
            </h2>
            <AccordionItem title="¿Por qué usar MisLíneas y cómo funciona?">
              <WhySection />
            </AccordionItem>
            <AccordionItem id="seguridad" title="Seguridad y Privacidad">
              <SecuritySection />
            </AccordionItem>
            <AccordionItem id="arco" title="Derechos ARCO y Denuncias">
              <ArcoSection />
            </AccordionItem>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
