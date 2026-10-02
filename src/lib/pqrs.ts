import * as XLSX from "xlsx";

export const AREAS = [
  "Servicio", "Cartera", "Tecnología", "Aseguramiento", "Recuperaciones", "Comercial",
  "Alianzas", "Gerencia", "Otorgamiento", "Jurídico", "Auditoria",
] as const;

export const TIPOS = ["Solicitud", "Inconformidad", "Sugerencia", "Felicitación/Agradecimiento"] as const;

export const ESTADOS = ["Sin respuesta", "Pendiente de revisión", "Respondido por área", "Pendiente envío", "Enviado"] as const;

export const REGIONALES = ["Cali", "Bogotá", "Medellín", "Barranquilla", "Bucaramanga", "Pereira", "Cartagena", "Palmira"];

export type Pqrs = {
  id: string; usuario: string; regional: string; no_pqrs: string; estado: string; tipo_pqrs: string;
  motivo: string; fecha_creacion: string; creado_por: string; descripcion: string; categoria: string | null;
  area: string | null; encargado: string | null; analisis_ia: string | null; confianza: number | null;
  requiere_revision: boolean; respuesta: string | null; fecha_respuesta: string | null;
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
    "Fecha de creación": new Date(r.fecha_creacion).toLocaleString("es-CO"),
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

export function estadoClass(e: string) {
  switch (e) {
    case "Sin respuesta": return "bg-destructive/10 text-destructive";
    case "Pendiente de revisión": return "bg-warning/25 text-warning-foreground";
    case "Respondido por área": return "bg-info/15 text-info";
    case "Pendiente envío": return "bg-accent/40 text-accent-foreground";
    default: return "bg-primary/15 text-primary-deep";
  }
}

/** Horas entre creación y respuesta */
export function horasRespuesta(r: Pqrs) {
  if (!r.fecha_respuesta) return null;
  return (new Date(r.fecha_respuesta).getTime() - new Date(r.fecha_creacion).getTime()) / 36e5;
}
