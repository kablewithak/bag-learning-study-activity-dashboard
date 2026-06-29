export interface GroupStatsSummary {
  id: string;
  name: string;
  student_count: number;
}

export interface StudentActivityStats {
  student_id: string;
  student_name: string;
  total_activities: number;
  lesson_completed_count: number;
  quiz_attempted_count: number;
  note_added_count: number;
  average_quiz_score: number | null;
  last_active_at: string | null;
}

export interface ActivityTrendPoint {
  day: string;
  activity_count: number;
}

export interface GroupStatsResponse {
  group: GroupStatsSummary;
  students: StudentActivityStats[];
  activity_trend: ActivityTrendPoint[];
}

export type ActivityType = "lesson_completed" | "quiz_attempted" | "note_added";

export interface ActivityCreatePayload {
  type: ActivityType;
  score: number | null;
}

export interface ActivityResponse {
  id: string;
  student_id: string;
  type: ActivityType;
  score: number | null;
  created_at: string;
}
