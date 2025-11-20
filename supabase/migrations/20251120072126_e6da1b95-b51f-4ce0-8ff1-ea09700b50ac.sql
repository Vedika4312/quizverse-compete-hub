-- Create interview room presence table
CREATE TABLE IF NOT EXISTS interview_room_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('interviewer', 'candidate')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  video_enabled BOOLEAN DEFAULT true,
  audio_enabled BOOLEAN DEFAULT true,
  UNIQUE(session_id, user_id)
);

-- Add RLS policies
ALTER TABLE interview_room_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence for their sessions"
  ON interview_room_presence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = interview_room_presence.session_id
      AND (interview_sessions.candidate_id = auth.uid() OR interview_sessions.interviewer_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own presence"
  ON interview_room_presence
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
  ON interview_room_presence
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER TABLE interview_room_presence REPLICA IDENTITY FULL;