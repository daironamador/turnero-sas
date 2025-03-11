
-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  is_vip BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  called_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  counter_number INTEGER,
  patient_name TEXT,
  redirected_to TEXT,
  redirected_from TEXT,
  previous_ticket_number TEXT
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  service_id UUID REFERENCES services(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  logo TEXT,
  ticket_footer TEXT,
  display_message TEXT
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  is_active BOOLEAN DEFAULT true,
  service_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default services
INSERT INTO services (code, name, description, is_active)
VALUES 
  ('CG', 'Consulta General', 'Consultas médicas generales', true),
  ('RX', 'Rayos X', 'Servicios de radiología y rayos X', true),
  ('RR', 'Recoger Resultados', 'Recogida de resultados de exámenes', true),
  ('EX', 'Exámenes', 'Exámenes médicos especializados', true),
  ('OT', 'Otros Servicios', 'Otros servicios médicos', true)
ON CONFLICT (code) DO NOTHING;

-- Insert default company settings
INSERT INTO company_settings (id, name, address, phone, email, ticket_footer, display_message)
VALUES 
  (
    gen_random_uuid(), 
    'Centro Oftalmológico', 
    'Av. Principal #123, Ciudad', 
    '(123) 456-7890', 
    'info@ocular-clinic.com',
    'Gracias por su visita. Su salud visual es nuestra prioridad.',
    'Bienvenido a Centro Oftalmológico. Por favor, espere a ser llamado.'
  )
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_service_type ON tickets(service_type);
