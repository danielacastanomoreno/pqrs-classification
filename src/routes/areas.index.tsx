import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAreas, usePqrs } from "@/hooks/use-pqrs";
import { AREAS, areaSlug } from "@/lib/pqrs";

export const Route = createFileRoute("/areas/")({
  head: () => ({
    meta: [
      { title: "Áreas de gestión · Fecoomeva" },
      { name: "description", content: "Áreas responsables de la gestión de PQRS y sus encargados." },
      { property: "og:title", content: "Áreas de gestión · Fecoomeva" },
      { property: "og:description", content: "Dashboards por área de gestión de PQRS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Areas,
});

function Areas() {
  const { data = [] } = usePqrs();
  const { data: areas } = useAreas();
  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-primary-deep">Áreas de gestión</h1>
      <p className="text-sm text-muted-foreground">Cada área tiene su propio dashboard para responder y notificar casos.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((a) => {
          const ar = data.filter((r) => r.area === a);
          const c = (e: string) => ar.filter((r) => r.estado === e).length;
          return (
            <Link key={a} to="/areas/$area" params={{ area: areaSlug(a) }} className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold group-hover:text-primary">{a}</h2>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-bold text-secondary-foreground">{ar.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Encargado: {areas?.find((x) => x.nombre === a)?.encargado ?? "—"}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div><b className="block text-lg text-destructive">{c("Abierto")}</b>Abiertos</div>
                <div><b className="block text-lg text-primary">{c("Cerrado")}</b>Cerrados</div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
