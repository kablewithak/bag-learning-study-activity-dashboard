import type {
  ActivityCreatePayload,
  ActivityResponse,
  ActivityTrendPoint,
  ActivityType,
  GroupStatsResponse,
  GroupStatsSummary,
  StudentActivityStats,
} from "../types/api";

export class ApiClientError extends Error {
  public readonly status: number | null;

  public constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

export async function getGroupStats(groupId: string): Promise<GroupStatsResponse> {
  const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}/stats`);
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new ApiClientError(getErrorMessage(response.status, payload), response.status);
  }

  return parseGroupStatsResponse(payload);
}

export async function createActivity(
  studentId: string,
  payload: ActivityCreatePayload,
  idempotencyKey: string,
): Promise<ActivityResponse> {
  const response = await fetch(`/api/students/${encodeURIComponent(studentId)}/activities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  const responsePayload = await readResponsePayload(response);

  if (!response.ok) {
    throw new ApiClientError(getErrorMessage(response.status, responsePayload), response.status);
  }

  return parseActivityResponse(responsePayload);
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const responseText = await response.text();
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function getErrorMessage(status: number, payload: unknown): string {
  const detail = getErrorDetail(payload);

  if (status === 401) {
    return "The app could not authenticate with the API.";
  }
  if (status === 404) {
    return "That student or study group no longer exists. Refresh the dashboard and try again.";
  }
  if (status === 409) {
    return "This request key was already used with different activity details. Start a new activity entry.";
  }
  if (status >= 500) {
    return "The dashboard service had a problem. Retry the same activity when it is available.";
  }

  return detail ?? "The dashboard service returned an unexpected response.";
}

function getErrorDetail(payload: unknown): string | null {
  if (!isRecord(payload) || typeof payload.detail !== "string") {
    return null;
  }

  return payload.detail;
}

function parseGroupStatsResponse(payload: unknown): GroupStatsResponse {
  if (!isRecord(payload)) {
    throw new ApiClientError("The dashboard service returned an invalid response.");
  }

  return {
    group: parseGroupSummary(payload.group),
    students: parseArray(payload.students, parseStudentStats, "students"),
    activity_trend: parseArray(payload.activity_trend, parseTrendPoint, "activity_trend"),
  };
}

function parseGroupSummary(value: unknown): GroupStatsSummary {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isNonNegativeInteger(value.student_count)
  ) {
    throw new ApiClientError("The dashboard service returned invalid group data.");
  }

  return {
    id: value.id,
    name: value.name,
    student_count: value.student_count,
  };
}

function parseStudentStats(value: unknown): StudentActivityStats {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.student_id) ||
    !isNonEmptyString(value.student_name) ||
    !isNonNegativeInteger(value.total_activities) ||
    !isNonNegativeInteger(value.lesson_completed_count) ||
    !isNonNegativeInteger(value.quiz_attempted_count) ||
    !isNonNegativeInteger(value.note_added_count) ||
    !isNullableFiniteNumber(value.average_quiz_score) ||
    !isNullableNonEmptyString(value.last_active_at)
  ) {
    throw new ApiClientError("The dashboard service returned invalid student statistics.");
  }

  return {
    student_id: value.student_id,
    student_name: value.student_name,
    total_activities: value.total_activities,
    lesson_completed_count: value.lesson_completed_count,
    quiz_attempted_count: value.quiz_attempted_count,
    note_added_count: value.note_added_count,
    average_quiz_score: value.average_quiz_score,
    last_active_at: value.last_active_at,
  };
}

function parseTrendPoint(value: unknown): ActivityTrendPoint {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.day) ||
    !isNonNegativeInteger(value.activity_count)
  ) {
    throw new ApiClientError("The dashboard service returned invalid activity trend data.");
  }

  return {
    day: value.day,
    activity_count: value.activity_count,
  };
}

function parseActivityResponse(value: unknown): ActivityResponse {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.student_id) ||
    !isActivityType(value.type) ||
    !isNullableFiniteNumber(value.score) ||
    !isNonEmptyString(value.created_at)
  ) {
    throw new ApiClientError("The dashboard service returned invalid activity data.");
  }

  return {
    id: value.id,
    student_id: value.student_id,
    type: value.type,
    score: value.score,
    created_at: value.created_at,
  };
}

function parseArray<T>(
  value: unknown,
  parser: (item: unknown) => T,
  fieldName: string,
): T[] {
  if (!Array.isArray(value)) {
    throw new ApiClientError(`The dashboard service returned an invalid ${fieldName} field.`);
  }

  return value.map(parser);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isActivityType(value: unknown): value is ActivityType {
  return value === "lesson_completed" || value === "quiz_attempted" || value === "note_added";
}
