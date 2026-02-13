-- Tabla para configuraciones del bot (Prompt, Plan de negocios, Estado)
CREATE TABLE IF NOT EXISTS bot_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para el historial de chats
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_id TEXT NOT NULL, -- WhatsApp ID del cliente
  customer_name TEXT,
  message TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' o 'assistant'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para mensajes programados
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_number TEXT NOT NULL,
  message TEXT NOT NULL,
  schedule_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para prospectos y ventas
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_id TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  status TEXT DEFAULT 'prospect', -- 'prospect', 'hot_lead', 'closed_deal', 'needs_intervention'
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Insertar valores iniciales por defecto
INSERT INTO bot_settings (key, value) VALUES 
('is_active', 'true'),
('ai_instructions', 'Eres un asistente de ventas experto y amable. Tu objetivo es ayudar a los clientes con sus dudas y cerrar ventas.'),
('business_plan', 'Empresa: BusinessChat. Producto: Sistema de Automatización para WhatsApp.')
ON CONFLICT (key) DO NOTHING;
