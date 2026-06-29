import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { ApiClientError, createActivity } from "../lib/api";
import type { ActivityCreatePayload, ActivityType, StudentActivityStats } from "../types/api";

interface ActivityCreateFormProps {
  students: StudentActivityStats[];
  onActivityCreated: () => Promise<void>;
}

interface RetainedSubmission {
  studentId: string;
  payload: ActivityCreatePayload;
  idempotencyKey: string;
}

const activityOptions: Array<{ value: ActivityType; label: string }> = [
  { value: "lesson_completed", label: "Lesson completed" },
  { value: "quiz_attempted", label: "Quiz attempted" },
  { value: "note_added", label: "Note added" },
];

export function ActivityCreateForm({ students, onActivityCreated }: ActivityCreateFormProps) {
  const [studentId, setStudentId] = useState(students[0]?.student_id ?? "");
  const [activityType, setActivityType] = useState<ActivityType>("lesson_completed");
  const [scoreInput, setScoreInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [retainedSubmission, setRetainedSubmission] = useState<RetainedSubmission | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedStudent = useMemo(
    () => students.find((student) => student.student_id === studentId) ?? null,
    [studentId, students],
  );

  useEffect(() => {
    if (!students.some((student) => student.student_id === studentId)) {
      setStudentId(students[0]?.student_id ?? "");
    }
  }, [studentId, students]);

  const mutation = useMutation({
    mutationFn: (submission: RetainedSubmission) =>
      createActivity(submission.studentId, submission.payload, submission.idempotencyKey),
    onSuccess: async (_activity, submission) => {
      const student = students.find((entry) => entry.student_id === submission.studentId);
      const studentName = student?.student_name ?? "Student";

      await onActivityCreated();

      setRetainedSubmission(null);
      setSuccessMessage(`${studentName}'s activity was recorded.`);
      setActivityType("lesson_completed");
      setScoreInput("");
    },
  });

  function submitActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    const payload = buildPayload(activityType, scoreInput);
    if (typeof payload === "string") {
      setValidationError(payload);
      return;
    }
    if (!selectedStudent) {
      setValidationError("Choose a student before recording an activity.");
      return;
    }

    const submission =
      retainedSubmission !== null &&
      retainedSubmission.studentId === selectedStudent.student_id &&
      samePayload(retainedSubmission.payload, payload)
        ? retainedSubmission
        : {
            studentId: selectedStudent.student_id,
            payload,
            idempotencyKey: crypto.randomUUID(),
          };

    setRetainedSubmission(submission);
    mutation.mutate(submission);
  }

  function retryExactSubmission() {
    if (retainedSubmission !== null) {
      mutation.mutate(retainedSubmission);
    }
  }

  const errorMessage = mutation.isError ? getSubmissionErrorMessage(mutation.error) : null;
  const showQuizScore = activityType === "quiz_attempted";

  return (
    <section className="rounded-panel border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="add-activity-title">
      <div>
        <h2 id="add-activity-title" className="text-lg font-semibold text-ink">
          Add study activity
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Entries are written through the typed API and protected by an idempotency key.
        </p>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={submitActivity}>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Student
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={mutation.isPending || students.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-ink shadow-sm focus:border-purple-500 focus:outline-none"
          >
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>
                {student.student_name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Activity type
          <select
            value={activityType}
            onChange={(event) => {
              setActivityType(event.target.value as ActivityType);
              setValidationError(null);
            }}
            disabled={mutation.isPending}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-ink shadow-sm focus:border-purple-500 focus:outline-none"
          >
            {activityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {showQuizScore ? (
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Quiz score <span className="font-normal text-slate-500">(optional, whole number 0–100)</span>
            <input
              inputMode="numeric"
              value={scoreInput}
              onChange={(event) => setScoreInput(event.target.value)}
              placeholder="For example: 85"
              disabled={mutation.isPending}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-ink shadow-sm focus:border-purple-500 focus:outline-none"
            />
          </label>
        ) : null}

        {validationError !== null ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700" role="alert">
            {validationError}
          </p>
        ) : null}

        {errorMessage !== null ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-slate-700" role="alert">
            <p>{errorMessage}</p>
            {retainedSubmission !== null ? (
              <button
                type="button"
                onClick={retryExactSubmission}
                disabled={mutation.isPending}
                className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-2 font-semibold text-ink hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Retry exact activity
              </button>
            ) : null}
          </div>
        ) : null}

        {successMessage !== null ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-slate-700" role="status">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={mutation.isPending || students.length === 0}
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? "Recording activity…" : "Record activity"}
        </button>

        <p className="text-xs leading-5 text-slate-500">
          A recoverable submit failure retains the same idempotency key and payload for the retry button. Editing the
          form creates a new request identity.
        </p>
      </form>
    </section>
  );
}

function buildPayload(activityType: ActivityType, scoreInput: string): ActivityCreatePayload | string {
  if (activityType !== "quiz_attempted") {
    return { type: activityType, score: null };
  }

  const normalizedScore = scoreInput.trim();
  if (!normalizedScore) {
    return { type: activityType, score: null };
  }
  if (!/^\d+$/.test(normalizedScore)) {
    return "Quiz score must be a whole number from 0 to 100.";
  }

  const score = Number(normalizedScore);
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return "Quiz score must be a whole number from 0 to 100.";
  }

  return { type: activityType, score };
}

function samePayload(left: ActivityCreatePayload, right: ActivityCreatePayload): boolean {
  return left.type === right.type && left.score === right.score;
}

function getSubmissionErrorMessage(error: Error): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Could not reach the dashboard service. The activity was not confirmed; retry the exact request when it is available.";
}
