import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toJalali, formatTime } from "../utils/date";
import type { Attendance, Program, Person } from "../types";

interface DashStats {
  totalPeople: number;
  totalPrograms: number;
  todayAttendances: number;
  presentToday: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats>({
    totalPeople: 0,
    totalPrograms: 0,
    todayAttendances: 0,
    presentToday: 0,
  });
  const [recentPrograms, setRecentPrograms] = useState<Program[]>([]);
  const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [
      { count: peopleCount },
      { count: programsCount },
      { data: todayAtt },
      { data: programs },
      { data: recentAtt },
    ] = await Promise.all([
      supabase.from("people").select("*", { count: "exact", head: true }),
      supabase.from("programs").select("*", { count: "exact", head: true }),
      supabase.from("attendances").select("status").eq("date", today),
      supabase
        .from("programs")
        .select("*")
        .order("date", { ascending: false })
        .limit(5),
      supabase
        .from("attendances")
        .select(
          "*, person:people(first_name,last_name), program:programs(name,date)",
        )
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    setStats({
      totalPeople: peopleCount ?? 0,
      totalPrograms: programsCount ?? 0,
      todayAttendances: todayAtt?.length ?? 0,
      presentToday: todayAtt?.filter((a) => a.status === "حاضر").length ?? 0,
    });
    setRecentPrograms((programs as Program[]) ?? []);
    setRecentAttendances((recentAtt as Attendance[]) ?? []);
    setLoading(false);
  }

  if (loading) return <div className="loading-screen">در حال بارگذاری...</div>;

  const statCards = [
    {
      icon: "👥",
      label: "کل افراد",
      value: stats.totalPeople,
      bg: "var(--primary-light)",
      color: "var(--primary)",
    },
    {
      icon: "📅",
      label: "کل برنامه‌ها",
      value: stats.totalPrograms,
      bg: "var(--info-light)",
      color: "var(--info)",
    },
    {
      icon: "✅",
      label: "حضور امروز",
      value: stats.presentToday,
      bg: "var(--good-light)",
      color: "var(--good)",
    },
    {
      icon: "📋",
      label: "ثبت امروز",
      value: stats.todayAttendances,
      bg: "var(--warn-light)",
      color: "var(--warn)",
    },
  ];

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <h1>خوش آمدید، ادمین 👋</h1>
          <p>امروز {toJalali(today)}</p>
        </div>
        <Link to="/programs" className="btn btn-light">
          ➕ برنامه جدید
        </Link>
      </div>

      <div className="stat-grid mb-24">
        {statCards.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div className="stat-value" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-pad">
            <div className="section-header mb-16">
              <h2>آخرین برنامه‌ها</h2>
              <Link to="/programs" className="btn btn-light btn-sm">
                مشاهده همه
              </Link>
            </div>
          </div>
          {recentPrograms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">برنامه‌ای ثبت نشده</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>نام برنامه</th>
                    <th>تاریخ</th>
                    <th>ساعت</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentPrograms.map((p) => (
                    <tr key={p.id}>
                      <td className="font-bold">{p.name}</td>
                      <td>{toJalali(p.date)}</td>
                      <td>{p.start_time}</td>
                      <td>
                        <Link
                          to={`/programs/${p.id}`}
                          className="btn btn-light btn-sm"
                        >
                          باز کردن
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-pad">
            <div className="section-header mb-16">
              <h2>آخرین ثبت‌های حضور</h2>
              <Link to="/reports" className="btn btn-light btn-sm">
                گزارش کامل
              </Link>
            </div>
          </div>
          {recentAttendances.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <div className="empty-title">حضوری ثبت نشده</div>
            </div>
          ) : (
            <>
              {recentAttendances.map((a) => {
                const name = a.person
                  ? `${(a.person as Person).first_name} ${(a.person as Person).last_name}`
                  : "—";
                const badge =
                  a.status === "حاضر"
                    ? "badge-good"
                    : a.status === "تاخیر"
                      ? "badge-warn"
                      : "badge-bad";
                return (
                  <div className="att-row" key={a.id}>
                    <div className="att-person">
                      <div className="att-avatar">{name.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-sm">{name}</div>
                        <div className="text-xs text-muted">
                          {(a.program as Program)?.name ?? ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex-center gap-8">
                      <span className="text-xs text-muted">
                        {formatTime(a.check_in_time)}
                      </span>
                      <span className={`badge ${badge}`}>{a.status}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
