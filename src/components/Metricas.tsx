import { Stat } from "@/components/AppShell";
import { horasRespuesta, type Pqrs } from "@/lib/pqrs";

function avg(rows: Pqrs[], from: number) {
  const hs = rows.filter((r) => new Date(r.fecha_creacion).getTime() >= from).map(horasRespuesta).filter((h): h is number => h != null);
  if (!hs.length) return "—";
  const h = hs.reduce((a, b) => a + b, 0) / hs.length;
  return h < 48 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} d`;
}

export function Conteos({ rows }: { rows: Pqrs[] }) {
  const c = (e: string) => rows.filter((r) => r.estado === e).length;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Total casos" value={rows.length} />
      <Stat label="Abiertos" value={c("Abierto")} tone="destructive" />
      <Stat label="Cerrados" value={c("Cerrado")} />
    </div>
  );
}

export function TiemposRespuesta({ rows }: { rows: Pqrs[] }) {
  const now = Date.now();
  const startYear = new Date(new Date().getFullYear(), 0, 1).getTime();
  const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-bold text-primary-deep">Tiempo promedio de respuesta</h3>
      <div className="mt-3 grid grid-cols-3 gap-4 text-center">
        {[["Última semana", avg(rows, now - 7 * 864e5)], ["Este mes", avg(rows, startMonth)], ["Este año", avg(rows, startYear)]].map(([l, v]) => (
          <div key={l} className="rounded-lg bg-secondary p-3">
            <div className="font-display text-2xl font-bold text-primary">{v}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
