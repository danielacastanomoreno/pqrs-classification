import { Fragment, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AREAS, estadoClass, exportExcel, fmtFecha, type Pqrs } from "@/lib/pqrs";
import { useAreas } from "@/hooks/use-pqrs";

export function CasosTable({ rows, editable = false }: { rows: Pqrs[]; editable?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{["No.PQRS", "Usuario", "Tipo", "Motivo", "Área", "Estado", "Fecha", ""].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Sin casos</td></tr>}
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr className="border-t hover:bg-muted/50">
                  <td className="px-3 py-2 font-semibold">{r.no_pqrs}</td>
                  <td className="px-3 py-2">{r.usuario}<div className="text-xs text-muted-foreground">{r.regional}</div></td>
                  <td className="px-3 py-2">{r.tipo_pqrs}</td>
                  <td className="max-w-48 truncate px-3 py-2">{r.motivo}</td>
                  <td className="px-3 py-2">{r.area}<div className="text-xs text-muted-foreground">{r.encargado}</div></td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${estadoClass(r.estado)}`}>{r.estado}</span></td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{fmtFecha(r.fecha_creacion)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button onClick={() => exportExcel([r], r.no_pqrs)} className="mr-2 text-xs font-semibold text-primary hover:underline">Excel</button>
                    <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-xs font-semibold text-primary-deep hover:underline">{open === r.id ? "Cerrar" : editable ? "Gestionar" : "Ver"}</button>
                  </td>
                </tr>
                {open === r.id && <tr className="border-t bg-secondary/40"><td colSpan={8} className="p-4"><Detalle r={r} editable={editable} /></td></tr>}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Detalle({ r, editable }: { r: Pqrs; editable: boolean }) {
  const { data: areas } = useAreas();
  const [resp, setResp] = useState(r.respuesta ?? r.respuesta_sugerida ?? "");
  const [area, setArea] = useState(r.area ?? "Servicio");
  const [busy, setBusy] = useState(false);

  async function upd(patch: Partial<Pqrs>, msg: string) {
    setBusy(true);
    const { error } = await supabase.from("pqrs").update(patch).eq("id", r.id);
    setBusy(false);
    error ? toast.error(error.message) : toast.success(msg);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 text-sm">
        <p><b>Descripción:</b> {r.descripcion}</p>
        <p><b>Categoría IA:</b> {r.categoria} {r.confianza != null && <span className="text-muted-foreground">({Math.round(r.confianza * 100)}%)</span>}</p>
        <p className="text-muted-foreground">{r.analisis_ia}</p>
        {r.respuesta_sugerida && (
          <div className="rounded-lg bg-primary/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-deep">Respuesta sugerida por IA</p>
            <p className="mt-1 text-sm">{r.respuesta_sugerida}</p>
          </div>
        )}
        <p className="text-xs">Creado por {r.creado_por}{r.fecha_respuesta && ` · Respondido ${fmtFecha(r.fecha_respuesta, true)}`}{r.fecha_envio && ` · Enviado ${fmtFecha(r.fecha_envio, true)}`}</p>
      </div>
      {editable && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select className="field" value={area} onChange={(e) => setArea(e.target.value)}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
            <button disabled={busy || area === r.area} onClick={() => upd({ area, encargado: areas?.find((a) => a.nombre === area)?.encargado ?? null, requiere_revision: false }, "Caso reasignado")}
              className="whitespace-nowrap rounded-full border border-primary px-3 text-xs font-semibold text-primary disabled:opacity-40">Reasignar</button>
          </div>
          <textarea rows={4} className="field" placeholder="Respuesta del área…" value={resp} onChange={(e) => setResp(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button disabled={busy || !resp.trim()} onClick={() => upd({ respuesta: resp, estado: "Cerrado", fecha_respuesta: new Date().toISOString(), requiere_revision: false }, "Respuesta guardada y caso cerrado")}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40">Responder y cerrar</button>
            {r.estado === "Cerrado" && (
              <button disabled={busy} onClick={() => upd({ estado: "Abierto" }, "Caso reabierto")}
                className="rounded-full border border-primary-deep px-4 py-2 text-xs font-bold text-primary-deep disabled:opacity-40">Reabrir</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
