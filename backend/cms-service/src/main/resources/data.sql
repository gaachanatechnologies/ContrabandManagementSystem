INSERT INTO contraband_categories (id, name, description, risk_level) VALUES
  (RANDOM_UUID(), 'Drugs', 'Illegal narcotics and controlled substances', 'critical'),
  (RANDOM_UUID(), 'Weapons', 'Firearms, explosives, and related items', 'high'),
  (RANDOM_UUID(), 'Counterfeit Goods', 'Fake branded products and counterfeit items', 'medium'),
  (RANDOM_UUID(), 'Wildlife Products', 'Illegal wildlife and derived products', 'high'),
  (RANDOM_UUID(), 'Electronics', 'Stolen or illegal electronic devices', 'medium'),
  (RANDOM_UUID(), 'Documents', 'Forged or illegal documents', 'medium');

-- Default admin user (password: admin123)
INSERT INTO users (id, email, full_name, badge_number, role, department, phone, is_active, created_at, updated_at, password_hash)
VALUES (RANDOM_UUID(), 'admin@police.gov.et', 'System Admin', 'ADM-0001', 'admin', 'HQ', '+251-000-0000', TRUE, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), '$2a$10$Kq9I5cK8b1N4y4o3e0tNDOzk8fr4E6qW7Gq8eG7l8w0qvJqY2a8x2');