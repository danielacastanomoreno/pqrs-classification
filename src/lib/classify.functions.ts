import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AREAS = ["Servicio","Cartera","Tecnología","Aseguramiento","Recuperaciones","Comercial","Alianzas","Gerencia","Otorgamiento","Jurídico","Auditoria"];

export type Clasificacion = {
  requiere_revision: boolean;
  razon_revision: string;
  casos: { descripcion: string; motivo: string; categoria: string; area: string; confianza: number; analisis: string }[];
};

export const clasificarPqrs = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ tipo: z.string(), motivo: z.string(), descripcion: z.string().min(5).max(8000) }).parse(d))
  .handler(async ({ data }): Promise<Clasificacion> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Falta la configuración de IA");
    const system = `Eres analista experto de PQRS de Fecoomeva (fondo de empleados / cooperativa financiera en Colombia).
Analiza el texto en detalle. Si contiene más de una petición independiente, sepárala en varios casos (uno por petición), cada uno con su propia descripción reescrita fiel al texto original.
Asigna a cada caso una de estas áreas: ${AREAS.join(", ")}.
Guía: Servicio=atención, quejas de trato, información general; Cartera=pagos, cuotas, estados de cuenta, saldos; Tecnología=app, portal, contraseñas, fallas digitales; Aseguramiento=seguros, pólizas, siniestros; Recuperaciones=cobranza, mora, acuerdos de pago, reportes a centrales; Comercial=productos, ahorro, afiliación, beneficios; Alianzas=convenios con terceros; Gerencia=escalamientos graves o temas estratégicos; Otorgamiento=solicitudes y estudio de créditos, desembolsos; Jurídico=demandas, tutelas, derechos de petición legales, embargos; Auditoria=posibles fraudes, irregularidades, control interno.
Si el texto es ambiguo, incompleto o no es claro a qué área pertenece, marca requiere_revision=true y explica por qué. Confianza entre 0 y 1.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Tipo: ${data.tipo}\nMotivo: ${data.motivo}\nDescripción:\n${data.descripcion}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "clasificar",
            parameters: {
              type: "object",
              properties: {
                requiere_revision: { type: "boolean" },
                razon_revision: { type: "string" },
                casos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      descripcion: { type: "string" },
                      motivo: { type: "string", description: "Motivo corto" },
                      categoria: { type: "string", description: "Subcategoría específica" },
                      area: { type: "string", enum: AREAS },
                      confianza: { type: "number" },
                      analisis: { type: "string", description: "Justificación breve" },
                    },
                    required: ["descripcion","motivo","categoria","area","confianza","analisis"],
                  },
                },
              },
              required: ["requiere_revision","razon_revision","casos"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "clasificar" } },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Demasiadas solicitudes, intenta en un momento.");
      if (res.status === 402) throw new Error("Se agotaron los créditos de IA.");
      throw new Error(`Error de IA [${res.status}]: ${t}`);
    }
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("La IA no devolvió una clasificación");
    return JSON.parse(args) as Clasificacion;
  });
