-- Row Level Security Policies

-- Users can only see their own profile and colleagues in their department
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Contraband items visibility based on role
CREATE POLICY "Field officers can view items they seized" ON contraband_items
  FOR SELECT USING (seized_by::text = auth.uid()::text);

CREATE POLICY "Supervisors and admins can view all items" ON contraband_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'supervisor', 'warehouse_manager', 'auditor')
    )
  );

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    to_user_id::text = auth.uid()::text OR 
    from_user_id::text = auth.uid()::text
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (from_user_id::text = auth.uid()::text);

-- Audit logs - only admins and auditors can view
CREATE POLICY "Admins and auditors can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'auditor')
    )
  );

-- Chain of custody - all authenticated users can view
CREATE POLICY "Authenticated users can view custody chain" ON custody_chain
  FOR SELECT USING (auth.role() = 'authenticated');

-- Evidence files - same as contraband items
CREATE POLICY "Users can view evidence for accessible contraband" ON evidence_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contraband_items ci
      WHERE ci.id = contraband_id
      AND (
        ci.seized_by::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id::text = auth.uid()::text 
          AND role IN ('admin', 'supervisor', 'warehouse_manager', 'auditor')
        )
      )
    )
  );
