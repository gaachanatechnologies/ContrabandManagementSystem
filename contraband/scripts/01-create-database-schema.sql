-- Ethiopian Federal Police Contraband Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table with role-based access
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  badge_number VARCHAR(50) UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supervisor', 'field_officer', 'warehouse_manager', 'auditor')),
  department VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contraband categories
CREATE TABLE contraband_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contraband items/seizures
CREATE TABLE contraband_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seizure_number VARCHAR(50) UNIQUE NOT NULL,
  category_id UUID REFERENCES contraband_categories(id),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  estimated_value DECIMAL(15,2),
  weight_kg DECIMAL(10,3),
  status VARCHAR(50) DEFAULT 'seized' CHECK (status IN ('seized', 'in_custody', 'under_investigation', 'pending_destruction', 'destroyed', 'released')),
  seizure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  seizure_location TEXT,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  seized_by UUID REFERENCES users(id),
  case_number VARCHAR(100),
  court_case_number VARCHAR(100),
  barcode VARCHAR(100) UNIQUE,
  rfid_tag VARCHAR(100) UNIQUE,
  storage_location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chain of custody tracking
CREATE TABLE custody_chain (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contraband_id UUID REFERENCES contraband_items(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  transfer_reason VARCHAR(255),
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location VARCHAR(255),
  notes TEXT,
  digital_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence photos and documents
CREATE TABLE evidence_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contraband_id UUID REFERENCES contraband_items(id),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  file_url TEXT,
  file_hash VARCHAR(255),
  uploaded_by UUID REFERENCES users(id),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Destruction records
CREATE TABLE destruction_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contraband_id UUID REFERENCES contraband_items(id),
  destruction_method VARCHAR(100),
  destruction_date TIMESTAMP WITH TIME ZONE,
  destruction_location VARCHAR(255),
  supervised_by UUID REFERENCES users(id),
  witnessed_by UUID[] DEFAULT '{}',
  court_order_number VARCHAR(100),
  destruction_certificate TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages system
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  subject VARCHAR(255),
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  message_type VARCHAR(50) DEFAULT 'general' CHECK (message_type IN ('general', 'approval_request', 'status_update', 'alert')),
  contraband_id UUID REFERENCES contraband_items(id),
  is_read BOOLEAN DEFAULT false,
  requires_response BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  parameters JSONB,
  generated_by UUID REFERENCES users(id),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contraband_items_status ON contraband_items(status);
CREATE INDEX idx_contraband_items_seizure_date ON contraband_items(seizure_date);
CREATE INDEX idx_contraband_items_seized_by ON contraband_items(seized_by);
CREATE INDEX idx_custody_chain_contraband_id ON custody_chain(contraband_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contraband_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE destruction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
