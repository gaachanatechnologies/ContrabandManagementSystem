-- Insert contraband categories
INSERT INTO contraband_categories (name, description, risk_level) VALUES
('Drugs', 'Illegal narcotics and controlled substances', 'critical'),
('Weapons', 'Firearms, explosives, and dangerous weapons', 'critical'),
('Counterfeit Goods', 'Fake products and counterfeit items', 'medium'),
('Stolen Property', 'Items reported as stolen', 'high'),
('Prohibited Items', 'Items banned from import/export', 'medium'),
('Currency', 'Illegal currency and financial instruments', 'high'),
('Electronics', 'Smuggled electronic devices', 'low'),
('Documents', 'Forged or illegal documents', 'high');

-- Insert initial admin user (this would be created through the auth system)
-- The actual user creation will be handled by Supabase Auth
