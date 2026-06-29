import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { ActivityCreateForm } from "../components/ActivityCreateForm";
import { ActivityTrendChart } from "../components/ActivityTrendChart";
import { StudentStatsTable } from "../components/StudentStatsTable";
import { ApiClientError, getGroupStats } from "../lib/api";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function GroupDashboardPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const isValidGroupId = groupId !== undefined && uuidPattern.test(groupId);

  const query = useQuery({
    queryKey: ["group-stats", groupId],
    queryFn: () => getGroupStats(groupId ?? ""),
    enabled: isValidGroupId,
  });

  if (!isValidGroupId) {
    return (
      <PageFrame>
        <section className="rounded-panel border border-amber-200 bg-amber-50 p-5" role="alert">
          <h1 className="text-lg font-semibold text-ink">Invalid study group URL</h1>
          <p className="mt-2 text-sm text-slate-700">
            Use the documented seeded group ID or open a valid group route.
          </p>
        </section>
      </PageFrame>
    );
  }

  if (query.isPending) {
    return (
      <PageFrame>
        <section className="rounded-panel border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
          <h1 className="text-lg font-semibold text-ink">Loading study activity…</h1>
          <p className="mt-2 text-sm text-slate-600">
            Fetching current group statistics from the dashboard service.
          </p>
        </section>
      </PageFrame>
    );
  }

  if (query.isError) {
    const message = getDashboardErrorMessage(query.error);

    return (
      <PageFrame>
        <section className="rounded-panel border border-rose-200 bg-rose-50 p-6" role="alert">
          <h1 className="text-lg font-semibold text-ink">Could not load the dashboard</h1>
          <p className="mt-2 text-sm text-slate-700">{message}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Retry dashboard load
          </button>
        </section>
      </PageFrame>
    );
  }

  const { group, students, activity_trend: activityTrend } = query.data;

  async function refreshDashboardAfterActivity(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ["group-stats", groupId] });
  }

  return (
    <PageFrame>
      <header className="rounded-panel bg-ink px-6 py-7 text-white shadow-sm">
        <p className="text-sm font-medium text-purple-200">Study activity dashboard</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
            <p className="mt-1 text-sm text-slate-200">
              {group.student_count} {group.student_count === 1 ? "student" : "students"} in this group
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100">
            Live PostgreSQL data
          </span>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <ActivityCreateForm students={students} onActivityCreated={refreshDashboardAfterActivity} />
        <ActivityTrendChart trend={activityTrend} />
      </section>

      <StudentStatsTable students={students} />
    </PageFrame>
  );
}

function getDashboardErrorMessage(error: Error): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Could not reach the dashboard service. Check that the backend is running, then retry.";
}

interface PageFrameProps {
  children: React.ReactNode;
}

function PageFrame({ children }: PageFrameProps) {
  return <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">{children}</main>;
}
