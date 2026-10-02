import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CasosTable } from "@/components/CasosTable";
import { Conteos, TiemposRespuesta } from "@/components/Metricas";
import { usePqrs } from "@/hooks/use-pqrs";
import { AREAS, ESTADOS, areaSlug, exportExcel } from "@/lib/pqrs";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard PQRS · Fecoomeva" },
      { name: "description", content: "Control interno de asignación y respuesta de PQRS en tiempo real." },
      { property: "og:title", content: "Dashboard PQRS · Fecoomeva" },
      { property: "og:description", content: "Casos sin respuesta, respondidos y pendientes de envío por área." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data = [], isLoading } = usePqrs();
  const [estado, setEstado] = useState("");
  const [q, setQ] = useState("");
  const rows = data.filter((r) => (!estado || r.estado === estado) && (!q || `${r.no_pqrs} ${r.usuario} ${r.motivo}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-primary-deep">Panel interno de PQRS</h1><p className="text-sm text-muted-foreground">Actualización en línea</p></div>
        <button onClick={() => exportExcel(rows, "pqrs-fecoomeva")} className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-deep">Exportar a Excel</button>
      </div>
      <div className="mt-6 space-y-6">
        <Conteos rows={data} />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <TiemposRespuesta rows={data} />
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold text-primary-deep">Casos por área</h3>
            <div className="mt-3 space-y-1.5">
              {AREAS.map((a) => {
                const ar = data.filter((r) => r.area === a);
                const pend = ar.filter((r) => r.estado === "Abierto").length;
                const max = Math.max(1, ...AREAS.map((x) => data.filter((r) => r.area === x).length));
                return (
                  <Link key={a} to="/areas/$area" params={{ area: areaSlug(a) }} className="flex items-center gap-3 text-sm hover:text-primary">
                    <span className="w-28 shrink-0">{a}</span>
                    <span className="h-2.5 flex-1 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(ar.length / max) * 100}%` }} /></span>
                    <span className="w-20 text-right text-xs"><b>{ar.length}</b> · {pend} pend.</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="field max-w-xs" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field max-w-xs" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Todos los estados</option>{ESTADOS.map((e) => <option key={e}>{e}</option>)}</select>
        </div>
        {isLoading ? <p className="text-muted-foreground">Cargando…</p> : <CasosTable rows={rows} editable />}
      </div>
    </AppShell>
  );
}
