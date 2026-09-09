import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toJalali } from "../utils/date";
import type { Person, Attendance } from "../types";

interface PersonRow {
  person: Person;
  total: number;
  present: number;
  absent: number;
  late: number;
  pct: number;
}

export default function StatsPage() {
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "pct" | "total">("name");

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);

    let query = supabase
      .from("attendances")
      .select("*, person:people(id, first_name, last_name, phone)");

    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);

    const { data } = await query;
    const atts = (data as Attendance[]) ?? [];

    const map = new Map<string, PersonRow>();
    for (const a of atts) {
      const p = a.person as Person;
      if (!p) continue;
      if (!map.has(p.id)) {
        map.set(p.id, {
          person: p,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          pct: 0,
        });
      }
      const row = map.get(p.id)!;
      row.total++;
      if (a.status === "حاضر") row.present++;
      if (a.status === "غایب") row.absent++;
      if (a.status === "تاخیر") row.late++;
    }

    const result = Array.from(map.values()).map((r) => ({
      ...r,
      pct: r.total ? Math.round(((r.present + r.late) / r.total) * 100) : 0,
    }));

    setRows(result);
    setLoading(false);
  }

  const handleFilter = () => fetchStats();

  const filtered = rows
    .filter(
      (r) =>
        `${r.person.first_name} ${r.person.last_name}`.includes(search) ||
        r.person.phone.includes(search),
    )
    .sort((a, b) => {
      if (sortBy === "pct") return b.pct - a.pct;
      if (sortBy === "total") return b.total - a.total;
      return `${a.person.first_name} ${a.person.last_name}`.localeCompare(
        `${b.person.first_name} ${b.person.last_name}`,
        "fa",
      );
    });

  const totalPresent = rows.reduce((s, r) => s + r.present, 0);
  const totalAbsent = rows.reduce((s, r) => s + r.absent, 0);
  const totalLate = rows.reduce((s, r) => s + r.late, 0);
  const totalAll = rows.reduce((s, r) => s + r.total, 0);
  const overallPct = totalAll
    ? Math.round(((totalPresent + totalLate) / totalAll) * 100)
    : 0;

  return (
    <div>
      <div className="section-header mb-24">
        <h2>📊 نمایش آمار</h2>
      </div>

      <div className="card card-pad mb-16">
        <div className="filter-bar">
          <div className="field">
            <label>از تاریخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label>تا تاریخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="field">
            <label>جستجو</label>
            <input
              placeholder="نام یا شماره..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div
            className="field"
            style={{ display: "flex", alignItems: "flex-end" }}
          >
            <button className="btn btn-primary w-full" onClick={handleFilter}>
              🔍 اعمال فیلتر
            </button>
          </div>
        </div>

        {(dateFrom || dateTo) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            ✕ پاک کردن فیلتر
          </button>
        )}
      </div>

      {!loading && rows.length > 0 && (
        <div className="stat-grid mb-24">
          <div className="stat-card">
            <div className="stat-icon">
              <span>📋</span>
            </div>
            <div className="stat-value" style={{ color: "var(--primary)" }}>
              {totalAll}
            </div>
            <div className="stat-label">کل رکوردها</div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "var(--good-light)" }}
            >
              <span>✅</span>
            </div>
            <div className="stat-value" style={{ color: "var(--good)" }}>
              {totalPresent}
            </div>
            <div className="stat-label">کل حاضر</div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "var(--bad-light)" }}
            >
              <span>❌</span>
            </div>
            <div className="stat-value" style={{ color: "var(--bad)" }}>
              {totalAbsent}
            </div>
            <div className="stat-label">کل غایب</div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "var(--warn-light)" }}
            >
              <span>📈</span>
            </div>
            <div className="stat-value" style={{ color: "var(--warn)" }}>
              {overallPct}%
            </div>
            <div className="stat-label">میانگین حضور</div>
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex-center gap-8 mb-12">
          <span className="text-xs text-muted">مرتب‌سازی:</span>
          {[
            { key: "name" as const, label: "نام" },
            { key: "pct" as const, label: "درصد حضور" },
            { key: "total" as const, label: "کل جلسات" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`btn btn-sm ${sortBy === key ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSortBy(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          در حال بارگذاری...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-title">داده‌ای یافت نشد</div>
            <div className="empty-sub">
              فیلتر تاریخ را تغییر دهید یا ابتدا حضور ثبت کنید
            </div>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>نام و نام‌خانوادگی</th>
                <th>شماره تلفن</th>
                <th>کل جلسات</th>
                <th>حاضر</th>
                <th>غایب</th>
                <th>تاخیر</th>
                <th>درصد حضور</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ person, total, present, absent, late, pct }) => {
                const barColor =
                  pct >= 80
                    ? "var(--good)"
                    : pct >= 50
                      ? "var(--warn)"
                      : "var(--bad)";
                return (
                  <tr key={person.id}>
                    <td>
                      <div className="flex-center gap-8">
                        <div className="att-avatar">
                          {person.first_name.charAt(0)}
                        </div>
                        <span className="font-bold">
                          {person.first_name} {person.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted text-sm">{person.phone}</td>
                    <td>{total}</td>
                    <td>
                      <span className="badge badge-good">{present}</span>
                    </td>
                    <td>
                      <span className="badge badge-bad">{absent}</span>
                    </td>
                    <td>
                      <span className="badge badge-warn">{late}</span>
                    </td>
                    <td>
                      <div style={{ minWidth: 90 }}>
                        <div className="flex-between mb-8">
                          <span
                            className="text-xs font-bold"
                            style={{ color: barColor }}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="score-bar-wrap">
                          <div
                            className="score-bar"
                            style={{ width: `${pct}%`, background: barColor }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link
                        to={`/people/${person.id}`}
                        className="btn btn-light btn-sm"
                      >
                        👤 پروفایل
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
