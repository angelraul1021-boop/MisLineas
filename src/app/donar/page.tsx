"use client";

import { ArrowLeft, Coffee, HeartHandshake, Server, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const KOFI_URL = "https://ko-fi.com/moraxh";

export default function DonarPage() {

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafaf9_0%,#f4f4f5_40%,#ffffff_100%)] font-sans text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col items-center justify-center gap-8 text-center"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-pink-50 text-pink-600">
            <HeartHandshake className="w-7 h-7" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              Apoya MisLíneas
            </h1>
            <p className="max-w-md text-sm leading-7 text-zinc-600 sm:text-base">
              MisLíneas es un proyecto ciudadano independiente, sin anuncios y
              sin fines de lucro. Consulta en tiempo real si tu CURP está
              registrada en alguna operadora, completamente gratis.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700">
                Más de{" "}
                <span className="font-bold text-zinc-950">60,000</span>{" "}
                consultas realizadas
              </span>
            </div>
            <p className="text-xs text-zinc-400 text-left">
              Cada consulta hace múltiples llamadas en tiempo real a los
              portales de las operadoras.
            </p>
          </div>

          <div className="w-full space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Costos mensuales
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm">
                <Server className="w-4 h-4 text-zinc-400 mb-2" />
                <p className="text-xs text-zinc-500">Hosting</p>
                <p className="text-lg font-bold text-zinc-900">$20 USD</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm">
                <Shield className="w-4 h-4 text-zinc-400 mb-2" />
                <p className="text-xs text-zinc-500">Proxies</p>
                <p className="text-lg font-bold text-zinc-900">$10 USD</p>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-zinc-500">Total mensual</span>
              <span className="text-sm font-bold text-zinc-900">$30 USD</span>
            </div>
          </div>

          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
          >
            <Coffee className="w-4 h-4" />
            Donar en Ko-fi
          </a>

          <p className="text-xs text-zinc-400">
            Las donaciones son voluntarias. MisLíneas seguirá siendo gratuito.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
