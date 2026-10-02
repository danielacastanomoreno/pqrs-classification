import { createServerFn } from "@tanstack/react-start";
import { Output, streamText } from "ai";
import { z } from "zod";
import { createLovableResponsesProvider, RESPONSES_PROVIDER_OPTIONS } from "./ai/responses.server";

const AREAS = ["Servicio","Cartera","Tecnología","Aseguramiento","Recuperaciones","Comercial","Alianzas","Gerencia","Otorgamiento","Jurídico","Auditoria"] as const;

const casoSchema = z.object({
  descripcion: z.string().describe("Descripción del caso reescrita fiel al texto original"),
  motivo: z.string().describe("Motivo corto y específico"),
  categoria: z.string().describe("Subcategoría específica"),
  area: z.enum(AREAS),
  confianza: z.number().describe("Confianza entre 0 y 1"),
  analisis: z.string().describe("Análisis detallado del texto: qué pide el usuario, hechos clave, datos mencionados y por qué corresponde al área"),
  respuesta_sugerida: z.string().describe("Borrador de respuesta personalizado para el asociado, citando los datos concretos del caso"),
});

const clasificacionSchema = z.object({
  requiere_revision: z.boolean(),
  razon_revision: z.string().nullable(),
  casos: z.array(casoSchema),
});

export type Clasificacion = {
  requiere_revision: boolean;
  razon_revision: string | null;
  casos: { descripcion: string; motivo: string; categoria: string; area: string; confianza: number; analisis: string; respuesta_sugerida: string }[];
};

export const clasificarPqrs = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ tipo: z.string(), motivo: z.string(), descripcion: z.string().min(5).max(8000) }).parse(d))
  .handler(async ({ data }): Promise<Clasificacion> => {
    const { provider } = createLovableResponsesProvider();
    const system = `Eres analista experto de PQRS de Fecoomeva (fondo de empleados / cooperativa financiera en Colombia).

ANÁLISIS DE TEXTO (lo más importante):
- Lee el texto completo con detalle: identifica qué pide o reclama la persona, los hechos, fechas, montos, canales, nombres o datos concretos que menciona.
- Si contiene más de una petición independiente, sepárala en varios casos (uno por petición), cada uno con su propia descripción reescrita fiel al texto original.
- En "analisis" explica de forma específica: qué solicita el asociado, qué hechos y datos respaldan el caso, y por qué corresponde al área elegida. Nada genérico: cita los elementos concretos del texto.

CLASIFICACIÓN — asigna cada caso a una de estas áreas: ${AREAS.join(", ")}.
Guía: Servicio=atención, quejas de trato, información general; Cartera=pagos, cuotas, estados de cuenta, saldos, paz y salvos, devoluciones de saldo; Tecnología=app, portal, contraseñas, fallas digitales; Aseguramiento=seguros, pólizas, siniestros; Recuperaciones=cobranza, mora, acuerdos de pago, reportes a centrales; Comercial=productos, ahorro, afiliación, beneficios; Alianzas=convenios con terceros; Gerencia=escalamientos graves o temas estratégicos; Otorgamiento=solicitudes y estudio de créditos, desembolsos; Jurídico=demandas, tutelas, derechos de petición legales, embargos; Auditoria=posibles fraudes, irregularidades, control interno.
Si el texto es ambiguo, incompleto o no es claro a qué área pertenece, marca requiere_revision=true y explica por qué en razon_revision (si no, usa null). Confianza entre 0 y 1.

RESPUESTA SUGERIDA:
- Redacta un borrador de respuesta institucional, en español, cordial y profesional, dirigido al asociado.
- Debe ser personalizada y específica: menciona lo que la persona pidió, los datos concretos que dio (correos, números, fechas, montos) y los pasos que seguirá el área responsable.
- Si falta un dato necesario para gestionar (p. ej. un correo sin @), pídelo explícitamente en la respuesta.
- No inventes compromisos de plazos ni resultados; indica que el área validará y gestionará el caso.`;

    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system,
        messages: [{ role: "user", content: `Tipo: ${data.tipo}\nMotivo: ${data.motivo}\nDescripción:\n${data.descripcion}` }],
        output: Output.object({ schema: clasificacionSchema }),
        providerOptions: RESPONSES_PROVIDER_OPTIONS,
        maxRetries: 0,
      });
      const output = await result.output;
      if (!output) throw new Error("La IA no devolvió una clasificación");
      return output as Clasificacion;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/\b429\b|rate.?limit/i.test(msg)) throw new Error("Demasiadas solicitudes, intenta en un momento.");
      if (/\b402\b|credit/i.test(msg)) throw new Error("Se agotaron los créditos de IA.");
      throw err instanceof Error ? err : new Error(msg);
    }
  });
