CREATE TABLE public.areas (
  nombre text PRIMARY KEY,
  encargado text NOT NULL,
  correo text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO anon, authenticated;
GRANT ALL ON public.areas TO service_role;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas abiertas" ON public.areas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.areas (nombre, encargado, correo) VALUES
('Servicio','Laura Gómez','servicio@fecoomeva.coop'),
('Cartera','Andrés Ramírez','cartera@fecoomeva.coop'),
('Tecnología','Camilo Restrepo','tecnologia@fecoomeva.coop'),
('Aseguramiento','Paula Martínez','aseguramiento@fecoomeva.coop'),
('Recuperaciones','Jorge Castaño','recuperaciones@fecoomeva.coop'),
('Comercial','Natalia Ospina','comercial@fecoomeva.coop'),
('Alianzas','Felipe Duarte','alianzas@fecoomeva.coop'),
('Gerencia','María Fernanda Ríos','gerencia@fecoomeva.coop'),
('Otorgamiento','Sebastián Vargas','otorgamiento@fecoomeva.coop'),
('Jurídico','Diana Moreno','juridico@fecoomeva.coop'),
('Auditoria','Ricardo Salazar','auditoria@fecoomeva.coop');

CREATE TABLE public.pqrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario text NOT NULL,
  regional text NOT NULL,
  no_pqrs text NOT NULL,
  estado text NOT NULL DEFAULT 'Sin respuesta',
  tipo_pqrs text NOT NULL,
  motivo text NOT NULL,
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  creado_por text NOT NULL,
  descripcion text NOT NULL,
  categoria text,
  area text REFERENCES public.areas(nombre),
  encargado text,
  analisis_ia text,
  confianza numeric,
  requiere_revision boolean NOT NULL DEFAULT false,
  respuesta text,
  fecha_respuesta timestamptz,
  fecha_envio timestamptz,
  parent_id uuid REFERENCES public.pqrs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pqrs TO anon, authenticated;
GRANT ALL ON public.pqrs TO service_role;
ALTER TABLE public.pqrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pqrs abiertas" ON public.pqrs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.pqrs;