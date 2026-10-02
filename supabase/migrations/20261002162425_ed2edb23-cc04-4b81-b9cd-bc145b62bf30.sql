ALTER TABLE public.pqrs ALTER COLUMN estado SET DEFAULT 'Abierto';
UPDATE public.pqrs SET estado = 'Abierto' WHERE estado IN ('Sin respuesta', 'Pendiente de revisión');
UPDATE public.pqrs SET estado = 'Cerrado' WHERE estado IN ('Respondido por área', 'Pendiente envío', 'Enviado');
ALTER TABLE public.pqrs ADD CONSTRAINT pqrs_estado_check CHECK (estado IN ('Abierto', 'Cerrado'));