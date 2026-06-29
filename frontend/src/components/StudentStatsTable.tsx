import { useMemo, useState } from "react";

import { formatAverageQuizScore, formatLastActive } from "../lib/format";
import type { StudentActivityStats } from "../types/api";

type SortDirection = "ascending" | "descending";

interface StudentStatsTableProps {
  students: StudentActivityStats[];
}

export function StudentStatsTable({ students }: StudentStatsTableProps) {
  const [sortDirection, setSortDirection] = useState<SortDirection>("descending");

  const sortedStudents = useMemo(() => {
    const multiplier = sortDirection === "ascending" ? 1 : -1;

    return [...students].sort((left, right) => {
      const activityDifference = left.total_activities - right.total_activities;
      if (activityDifference !== 0) {
        return activityDifference * multiplier;
      }

      return left.student_name.localeCompare(right.student_name);
    });
  }, [sortDirection, students]);

  function toggleActivitySort(): void {
    setSortDirection((current) =>
      current === "ascending" ? "descending" : "ascending",
    );
  }

  const sortLabel =
    sortDirection === "ascending" ? "least activity first" : "most activity first";

  return (
    <section className="rounded-panel border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Student activity</h2>
          <p className="text-sm text-slate-600">
            Sorted by total activities, {sortLabel}.
          </p>
        </div>
        <span className="text-sm text-slate-500">{students.length} students</span>
      </div>

      {students.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-600">No students are in this group yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Student
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={toggleActivitySort}
                    className="inline-flex items-center gap-1 rounded text-left font-semibold hover:text-ink"
                    aria-label={`Sort by total activities: ${sortLabel}`}
                  >
                    Total activities
                    <span aria-hidden="true">{sortDirection === "ascending" ? "↑" : "↓"}</span>
                  </button>
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Average quiz score
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Last active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedStudents.map((student) => (
                <tr key={student.student_id}>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-ink">
                    {student.student_name}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {student.total_activities} activities
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {formatAverageQuizScore(student.average_quiz_score)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {formatLastActive(student.last_active_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
