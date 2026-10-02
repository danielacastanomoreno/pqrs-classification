import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { clasificarPqrs, type Clasificacion } from "@/lib/classify.functions";
import { ESTADOS, REGIONALES, TIPOS, areaSlug } from "@/lib/pqrs";
import { useAreas } from "@/hooks/use-pqrs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Radicar PQRS · Fecoomeva" },
      { name: "description", content: "Registro de PQRS con clasificación por inteligencia artificial y asignación automática al área responsable." },
      { property: "og:title", content: "Radicar PQRS · Fecoomeva" },
      { property: "og:description", content: "Clasificación inteligente y asignación de PQRS por área." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const hoy = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);

function Index() {
  const clasificar = useServerFn(clasificarPqrs);
  const { data: areas } = useAreas();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(Clasificacion & { no: string }) | null>(null);
  const [f, setF] = useState({
    usuario: "", regional: "Cali", no_pqrs: `PQRS-${Date.now().toString().slice(-6)}`, estado: "Sin respuesta",
    tipo_pqrs: "Solicitud", motivo: "", fecha_creacion: hoy(), creado_por: "", descripcion: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const c = await clasificar({ data: { tipo: f.tipo_pqrs, motivo: f.motivo, descripcion: f.descripcion } });
      const enc = (a: string) => areas?.find((x) => x.nombre === a)?.encargado ?? null;
      const base = { ...f, fecha_creacion: new Date(f.fecha_creacion).toISOString() };
      const multi = c.casos.length > 1;
      const rows = c.casos.map((k, i) => ({
        ...base,
        no_pqrs: multi ? `${f.no_pqrs}-${i + 1}` : f.no_pqrs,
        motivo: multi ? k.motivo : f.motivo || k.motivo,
        descripcion: multi ? k.descripcion : f.descripcion,
        categoria: k.categoria, area: k.area, encargado: enc(k.area),
        analisis_ia: c.requiere_revision ? `${k.analisis} · Revisión: ${c.razon_revision}` : k.analisis,
        confianza: k.confianza, requiere_revision: c.requiere_revision,
        estado: c.requiere_revision ? "Pendiente de revisión" : f.estado,
      }));
      const { error } = await supabase.from("pqrs").insert(rows);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["pqrs"] });
      setResult({ ...c, no: f.no_pqrs });
      toast.success(multi ? `Se crearon ${rows.length} casos` : "PQRS clasificada y asignada");
      setF({ ...f, usuario: "", motivo: "", descripcion: "", no_pqrs: `PQRS-${Date.now().toString().slice(-6)}`, fecha_creacion: hoy() });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-primary-deep">Conexión con Base de Datos Interna</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registra la PQRS. La IA analiza el texto, la clasifica y la asigna al encargado del área.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <L label="Usuario"><input required className="field" value={f.usuario} onChange={set("usuario")} /></L>
            <L label="Regional"><select className="field" value={f.regional} onChange={set("regional")}>{REGIONALES.map((r) => <option key={r}>{r}</option>)}</select></L>
            <L label="No.PQRS"><input required className="field" value={f.no_pqrs} onChange={set("no_pqrs")} /></L>
            <L label="Estado"><select className="field" value={f.estado} onChange={set("estado")}>{ESTADOS.map((r) => <option key={r}>{r}</option>)}</select></L>
            <L label="Tipo PQRS"><select className="field" value={f.tipo_pqrs} onChange={set("tipo_pqrs")}>{TIPOS.map((r) => <option key={r}>{r}</option>)}</select></L>
            <L label="Motivo"><input required className="field" value={f.motivo} onChange={set("motivo")} /></L>
            <L label="Fecha de creación"><input type="datetime-local" required className="field" value={f.fecha_creacion} onChange={set("fecha_creacion")} /></L>
            <L label="Creado por"><input required className="field" value={f.creado_por} onChange={set("creado_por")} /></L>
            <div className="sm:col-span-2"><L label="Descripción"><textarea required rows={6} className="field" value={f.descripcion} onChange={set("descripcion")} placeholder="Texto completo de la PQRS…" /></L></div>
          </div>
          <button disabled={loading} className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition hover:bg-primary-deep disabled:opacity-60">
            {loading ? "Analizando con IA…" : "Clasificar y asignar"}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-brand p-6 text-primary-foreground">
            <h2 className="text-lg font-bold">Resultado del análisis</h2>
            {!result && <p className="mt-2 text-sm opacity-85">Aquí verás la categoría, el área y el encargado asignado. Si la PQRS tiene varias peticiones, se separan en casos.</p>}
            {result?.requiere_revision && <p className="mt-3 rounded-lg bg-primary-foreground/15 p-3 text-sm"><b>Pendiente de revisión:</b> {result.razon_revision}</p>}
          </div>
          {result?.casos.map((k, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{result.casos.length > 1 ? `${result.no}-${i + 1}` : result.no}</span>
                <span className="text-xs text-muted-foreground">Confianza {Math.round(k.confianza * 100)}%</span>
              </div>
              <Link to="/areas/$area" params={{ area: areaSlug(k.area) }} className="mt-1 block font-display text-lg font-bold text-primary hover:underline">{k.area}</Link>
              <div className="text-sm font-semibold">{k.categoria}</div>
              <p className="mt-1 text-sm text-muted-foreground">{k.analisis}</p>
              <p className="mt-2 text-xs">Encargado: <b>{areas?.find((a) => a.nombre === k.area)?.encargado}</b></p>
            </div>
          ))}
        </aside>
      </div>
    </AppShell>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>{children}</label>;
}
