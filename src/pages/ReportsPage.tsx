import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toJalali, formatTime } from '../utils/date';
import { printFullReport } from '../utils/print';
import type { Attendance, Person, Program } from '../types';

export default function ReportsPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading]         = useState(true);

  // Filters
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [personFilter,  setPersonFilter]  = useState('');

  // Reference data
  const [programs, setPrograms] = useState<Program[]>([]);
  const [people,   setPeople]   = useState<Person[]>([]);

  useEffect(() => {
    // بارگذاری لیست‌ها برای فیلترها
    Promise.all([
      supabase.from('programs').select('id, name').order('date', { ascending: false }),
      supabase.from('people').select('id, first_name, last_name').order('first_name'),
    ]).then(([{ data: progs }, { data: ppl }]) => {
      setPrograms((progs as Program[]) ?? []);
      setPeople((ppl as Person[]) ?? []);
    });

    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);

    let query = supabase
      .from('attendances')
      .select('*, person:people(id, first_name, last_name, phone), program:programs(id, name, date)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (dateFrom)      query = query.gte('date', dateFrom);
    if (dateTo)        query = query.lte('date', dateTo);
    if (statusFilter)  query = query.eq('status', statusFilter);
    if (programFilter) query = query.eq('program_id', programFilter);
    if (personFilter)  query = query.eq('person_id', personFilter);

    const { data } = await query;
    setAttendances((data as Attendance[]) ?? []);
    setLoading(false);
  }

  function clearFilters() {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setProgramFilter('');
    setPersonFilter('');
  }

  // Summary
  const total   = attendances.length;
  const present = attendances.filter((a) => a.status === 'حاضر').length;
  const absent  = attendances.filter((a) => a.status === 'غایب').length;
  const late    = attendances.filter((a) => a.status === 'تاخیر').length;

  return (
    <div>
      <div className="section-header mb-24">
        <h2>📋 گزارش‌ها</h2>
        <button
          className="btn btn-info"
          onClick={() => printFullReport(attendances)}
          disabled={attendances.length === 0}
        >
          🖨️ چاپ / دانلود PDF
        </button>
      </div>

      {/* Filter Card */}
      <div className="card card-pad mb-16">
        <h3 className="font-bold mb-16">🔍 فیلترها</h3>
        <div className="form-grid">
          <div className="field">
            <label>از تاریخ</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>تا تاریخ</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="field">
            <label>وضعیت</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">همه وضعیت‌ها</option>
              <option value="حاضر">✅ حاضر</option>
              <option value="غایب">❌ غایب</option>
              <option value="تاخیر">⏰ تاخیر</option>
            </select>
          </div>
          <div className="field">
            <label>برنامه</label>
            <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
              <option value="">همه برنامه‌ها</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {toJalali(p.date)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>فرد</label>
            <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)}>
              <option value="">همه افراد</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-8 mt-16">
          <button className="btn btn-primary" onClick={fetchReports}>
            🔍 اعمال فیلتر
          </button>
          <button className="btn btn-ghost" onClick={() => { clearFilters(); }}>
            ✕ پاک کردن
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      {!loading && (
        <div className="kpi-grid mb-16">
          <div className="kpi-card">
            <div className="kpi-emoji">📋</div>
            <span className="kpi-value" style={{ color: 'var(--primary)' }}>{total}</span>
            <div className="kpi-label">کل رکوردها</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">✅</div>
            <span className="kpi-value" style={{ color: 'var(--good)' }}>{present}</span>
            <div className="kpi-label">حاضر</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">❌</div>
            <span className="kpi-value" style={{ color: 'var(--bad)' }}>{absent}</span>
            <div className="kpi-label">غایب</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">⏰</div>
            <span className="kpi-value" style={{ color: 'var(--warn)' }}>{late}</span>
            <div className="kpi-label">تاخیر</div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>در حال بارگذاری...</div>
      ) : attendances.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">رکوردی یافت نشد</div>
            <div className="empty-sub">فیلترها را تغییر دهید</div>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>نام و نام‌خانوادگی</th>
                <th>برنامه</th>
                <th>تاریخ</th>
                <th>وضعیت</th>
                <th>ساعت ورود</th>
                <th>ساعت خروج</th>
                <th>علت</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((a) => {
                const person  = a.person  as Person;
                const program = a.program as Program;
                const badge =
                  a.status === 'حاضر'  ? 'badge-good' :
                  a.status === 'تاخیر' ? 'badge-warn' : 'badge-bad';
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="flex-center gap-8">
                        <div className="att-avatar">{person?.first_name?.charAt(0) ?? '؟'}</div>
                        <span className="font-bold">
                          {person ? `${person.first_name} ${person.last_name}` : '—'}
                        </span>
                      </div>
                    </td>
                    <td>{program?.name ?? '—'}</td>
                    <td>{toJalali(a.date)}</td>
                    <td><span className={`badge ${badge}`}>{a.status}</span></td>
                    <td>{formatTime(a.check_in_time)}</td>
                    <td>{formatTime(a.check_out_time)}</td>
                    <td className="text-muted text-sm">{a.reason || '—'}</td>
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
