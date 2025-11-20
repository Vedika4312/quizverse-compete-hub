import { supabase } from "@/integrations/supabase/client";

export const validateInterviewAccess = async (
  sessionId: string,
  userId: string
): Promise<{ hasAccess: boolean; role?: 'interviewer' | 'candidate'; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('candidate_id, interviewer_id, status')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return { hasAccess: false, error: 'Interview session not found' };
    }

    // Check if interview is active
    if (data.status === 'completed' || data.status === 'cancelled') {
      return { hasAccess: false, error: 'Interview has ended' };
    }

    // Check if user is a participant
    const isInterviewer = data.interviewer_id === userId;
    const isCandidate = data.candidate_id === userId;

    if (!isInterviewer && !isCandidate) {
      return { hasAccess: false, error: 'You are not authorized to join this interview' };
    }

    return {
      hasAccess: true,
      role: isInterviewer ? 'interviewer' : 'candidate'
    };
  } catch (error) {
    console.error('Error validating access:', error);
    return { hasAccess: false, error: 'Failed to validate access' };
  }
};
