-- Enable real-time for interview_sessions table
ALTER TABLE interview_sessions REPLICA IDENTITY FULL;

-- Add interview_sessions to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE interview_sessions;