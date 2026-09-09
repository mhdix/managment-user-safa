import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toJalali, formatTime } from "../utils/date";
import { printPersonReport } from "../utils/print";
import type { Person, Attendance, PersonStats } from "../types";

function calcStats(atts: Attendance[]): PersonStats {
  const total = atts.length;
  const present = atts.filter((a) => a.status === "حاضر").length;
  const absent = atts.filter((a) => a.status === "غایب").length;
  const late = atts.filter((a) => a.status === "تاخیر").length;
  return {
    total,
    present,
    absent,
    late,
    presentPercent: total ? Math.round(((present + late) / total) * 100) : 0,
  };
}

export default function PersonProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [person, setPerson] = useState<Person | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "حاضر" | "غایب" | "تاخیر">("all");

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  async function fetchAll() {
    setLoading(true);
    const [{ data: personData }, { data: attData }] = await Promise.all([
      supabase.from("people").select("*").eq("id", id!).single(),
      supabase
        .from("attendances")
        .select("*, program:programs(name, date, start_time)")
        .eq("person_id", id!)
        .order("date", { ascending: false }),
    ]);
    setPerson(personData as Person);
    setAttendances((attData as Attendance[]) ?? []);
    setLoading(false);
  }

  if (loading) return <div className="loading-screen">در حال بارگذاری...</div>;
  if (!person)
    return (
      <div className="empty-state">
        <p>فرد یافت نشد</p>
      </div>
    );

  const stats = calcStats(attendances);
  const filtered =
    tab === "all" ? attendances : attendances.filter((a) => a.status === tab);

  const barColor =
    stats.presentPercent >= 80
      ? "var(--good)"
      : stats.presentPercent >= 50
        ? "var(--warn)"
        : "var(--bad)";

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "all", label: `همه (${stats.total})` },
    { key: "حاضر", label: `✅ حاضر (${stats.present})` },
    { key: "غایب", label: `❌ غایب (${stats.absent})` },
    { key: "تاخیر", label: `⏰ تاخیر (${stats.late})` },
  ];

  return (
    <div>
      <div className="back-bar">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate("/people")}
        >
          ← برگشت
        </button>
        <span className="back-crumb">
          افراد / {person.first_name} {person.last_name}
        </span>
      </div>

      <div className="card mb-24">
        <div className="profile-header">
          <div className="big-avatar">{person.first_name.charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <div className="font-black" style={{ fontSize: 20 }}>
              {person.first_name} {person.last_name}
            </div>
            <div className="text-sm text-muted mt-4">📞 {person.phone}</div>

            <div className="mt-12">
              <div className="flex-between mb-8">
                <span className="text-xs font-bold">درصد حضور</span>
                <span className="text-xs font-bold" style={{ color: barColor }}>
                  {stats.presentPercent}%
                </span>
              </div>
              <div className="score-bar-wrap">
                <div
                  className="score-bar"
                  style={{
                    width: `${stats.presentPercent}%`,
                    background: barColor,
                  }}
                />
              </div>
            </div>
          </div>

          <button
            className="btn btn-info btn-sm no-print"
            onClick={() => printPersonReport(person, attendances)}
          >
            🖨️ چاپ گزارش
          </button>
        </div>

        <div className="kpi-grid" style={{ padding: "0 20px 20px" }}>
          <div className="kpi-card">
            <div className="kpi-emoji">📋</div>
            <span className="kpi-value" style={{ color: "var(--primary)" }}>
              {stats.total}
            </span>
            <div className="kpi-label">کل جلسات</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">✅</div>
            <span className="kpi-value" style={{ color: "var(--good)" }}>
              {stats.present}
            </span>
            <div className="kpi-label">حاضر</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">❌</div>
            <span className="kpi-value" style={{ color: "var(--bad)" }}>
              {stats.absent}
            </span>
            <div className="kpi-label">غایب</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">⏰</div>
            <span className="kpi-value" style={{ color: "var(--warn)" }}>
              {stats.late}
            </span>
            <div className="kpi-label">تاخیر</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          <div className="flex-between mb-16">
            <h3 className="font-bold">سوابق حضور</h3>
          </div>

          <div className="flex gap-8 mb-16" style={{ flexWrap: "wrap" }}>
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                className={`btn btn-sm ${tab === key ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">رکوردی یافت نشد</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>برنامه</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>ساعت ورود</th>
                  <th>ساعت خروج</th>
                  <th>علت</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const badge =
                    a.status === "حاضر"
                      ? "badge-good"
                      : a.status === "تاخیر"
                        ? "badge-warn"
                        : "badge-bad";
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const prog = a.program as any;
                  return (
                    <tr key={a.id}>
                      <td className="font-bold">{prog?.name ?? "—"}</td>
                      <td>{toJalali(a.date)}</td>
                      <td>
                        <span className={`badge ${badge}`}>{a.status}</span>
                      </td>
                      <td>{formatTime(a.check_in_time)}</td>
                      <td>{formatTime(a.check_out_time)}</td>
                      <td className="text-muted text-sm">{a.reason || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
