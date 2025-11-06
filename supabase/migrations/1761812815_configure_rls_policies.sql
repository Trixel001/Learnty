-- Migration: configure_rls_policies
-- Created at: 1761812815

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_dependencies ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow profile creation via edge function" ON profiles
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Achievements policies
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow achievement award via edge function" ON user_achievements
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Books policies
CREATE POLICY "Users can view their own books" ON books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own books" ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON books FOR UPDATE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);

-- Milestones policies
CREATE POLICY "Users can view milestones for their projects" ON milestones
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert milestones for their projects" ON milestones
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update milestones for their projects" ON milestones
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid()));

-- SRS cards policies
CREATE POLICY "Users can view their own SRS cards" ON srs_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own SRS cards" ON srs_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own SRS cards" ON srs_cards FOR UPDATE USING (auth.uid() = user_id);

-- Learning sessions policies
CREATE POLICY "Users can manage own learning sessions" ON learning_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Milestone dependencies policies
CREATE POLICY "Users can view milestone dependencies" ON milestone_dependencies
  FOR SELECT USING (EXISTS (SELECT 1 FROM milestones m WHERE m.id = milestone_id AND m.user_id = auth.uid()));

-- Focus sessions policies
CREATE POLICY "Users can view their own focus sessions" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own focus sessions" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);;