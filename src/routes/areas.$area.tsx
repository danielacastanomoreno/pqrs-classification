import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CasosTable } from "@/components/CasosTable";
import { Conteos, TiemposRespuesta } from "@/components/Metricas";
import { useAreas, usePqrs } from "@/hooks/use-pqrs";
import { areaFromSlug, exportExcel } from "@/lib/pqrs";

export const Route = createFileRoute("/areas/$area")({
  loader: ({ params }) => {
    const nombre = areaFromSlug(params.area);
    if (!nombre) throw notFound();
    return { nombre };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Área ${loaderData?.nombre ?? ""} · PQRS Fecoomeva` },
      { name: "description", content: `Dashboard de PQRS asignadas al área ${loaderData?.nombre ?? ""}.` },
      { property: "og:title", content: `Área ${loaderData?.nombre ?? ""} · PQRS Fecoomeva` },
      { property: "og:description", content: "Gestión, respuesta y notificación de casos del área." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  notFoundComponent: () => <AppShell><p>Área no encontrada. <Link to="/areas" className="text-primary underline">Ver áreas</Link></p></AppShell>,
  errorComponent: ({ error }) => <AppShell><p>{error.message}</p></AppShell>,
  component: AreaPage,
});

function AreaPage() {
  const { nombre } = Route.useLoaderData();
  const { data = [] } = usePqrs();
  const { data: areas } = useAreas();
  const rows = data.filter((r) => r.area === nombre);
  const info = areas?.find((a) => a.nombre === nombre);
  return (
    <AppShell>
      <Link to="/areas" className="text-sm text-primary hover:underline">← Áreas de gestión</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-deep">Área de {nombre}</h1>
          <p className="text-sm text-muted-foreground">Encargado: <b>{info?.encargado}</b> {info?.correo && `· ${info.correo}`}</p>
        </div>
        <button onClick={() => exportExcel(rows, `pqrs-${nombre}`)} className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-deep">Exportar a Excel</button>
      </div>
      <div className="mt-6 space-y-6">
        <Conteos rows={rows} />
        <TiemposRespuesta rows={rows} />
        <CasosTable rows={rows} editable />
      </div>
    </AppShell>
  );
}
