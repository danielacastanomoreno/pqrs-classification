import * as XLSX from "xlsx";

export const AREAS = [
  "Servicio", "Cartera", "Tecnología", "Aseguramiento", "Recuperaciones", "Comercial",
  "Alianzas", "Gerencia", "Otorgamiento", "Jurídico", "Auditoria",
] as const;

export const TIPOS = ["Solicitud", "Inconformidad", "Sugerencia", "Felicitación/Agradecimiento"] as const;

export const ESTADOS = ["Abierto", "Cerrado"] as const;

export const REGIONALES = ["Cali", "Bogotá", "Medellín", "Barranquilla", "Bucaramanga", "Pereira", "Cartagena", "Palmira"];

export type Pqrs = {
  id: string; usuario: string; regional: string; no_pqrs: string; estado: string; tipo_pqrs: string;
  motivo: string; fecha_creacion: string; creado_por: string; descripcion: string; categoria: string | null;
  area: string | null; encargado: string | null; analisis_ia: string | null; confianza: number | null;
  requiere_revision: boolean; respuesta: string | null; respuesta_sugerida: string | null; fecha_respuesta: string | null;
  fecha_envio: string | null; parent_id: string | null; created_at: string;
};

export function areaSlug(a: string) {
  return a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
export function areaFromSlug(s: string) {
  return AREAS.find((a) => areaSlug(a) === s);
}

export function exportExcel(rows: Pqrs[], name = "pqrs") {
  const data = rows.map((r) => ({
    Usuario: r.usuario,
    Regional: r.regional,
    "No.PQRS": r.no_pqrs,
    Estado: r.estado,
    "Tipo PQRS": r.tipo_pqrs,
    Motivo: r.motivo,
    "Fecha de creación": fmtFecha(r.fecha_creacion),
    "Creado por": r.creado_por,
    Descripción: r.descripcion,
    Categoría: r.categoria ?? "",
    Área: r.area ?? "",
    Encargado: r.encargado ?? "",
    Respuesta: r.respuesta ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PQRS");
  XLSX.writeFile(wb, `${name}.xlsx`);
}

/** dd/mm/aaaa (y hora si se pide) */
export function fmtFecha(iso: string | null | undefined, conHora = false) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  const base = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  return conHora ? `${base} ${p(d.getHours())}:${p(d.getMinutes())}` : base;
}

export function estadoClass(e: string) {
  switch (e) {
    case "Abierto": return "bg-destructive/10 text-destructive";
    default: return "bg-primary/15 text-primary-deep";
  }
}

/** Horas entre creación y respuesta */
export function horasRespuesta(r: Pqrs) {
  if (!r.fecha_respuesta) return null;
  return (new Date(r.fecha_respuesta).getTime() - new Date(r.fecha_creacion).getTime()) / 36e5;
}
