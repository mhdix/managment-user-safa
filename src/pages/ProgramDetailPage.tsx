import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toJalali, formatTime, nowISO } from '../utils/date';
import { printProgramReport } from '../utils/print';
import type { Program, Person, Attendance, AttendanceStatus, ProgramParticipant } from '../types';
import Modal from '../components/Modal';

// =================== اضافه کردن شرکت‌کننده ===================
function AddParticipantModal({
  programId,
  alreadyIds,
  onClose,
  onAdded,
}: {
  programId: string;
  alreadyIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('people').select('*').order('first_name').then(({ data }) => {
      const filtered = ((data as Person[]) ?? []).filter(
        (p) => !alreadyIds.includes(p.id)
      );
      setPeople(filtered);
    });
  }, [alreadyIds]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleAdd = async () => {
    if (!selected.length) return;
    setSaving(true);
    await supabase
      .from('program_participants')
      .insert(selected.map((person_id) => ({ program_id: programId, person_id })));
    setSaving(false);
    onAdded();
    onClose();
  };

  return (
    <Modal
      title="افزودن شرکت‌کننده"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !selected.length}>
            {saving ? 'در حال افزودن...' : `افزودن ${selected.length ? `(${selected.length} نفر)` : ''}`}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>انصراف</button>
        </>
      }
    >
      {people.length === 0 ? (
        <p className="text-muted">همه افراد قبلاً اضافه شده‌اند یا هیچ فردی ثبت نشده است.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {people.map((p) => {
            const checked = selected.includes(p.id);
            return (
              <label
                key={p.id}
                className="person-card"
                style={{ cursor: 'pointer', background: checked ? 'var(--primary-light)' : 'white' }}
              >
                <div className="flex-center gap-12">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <div className="att-avatar">{p.first_name.charAt(0)}</div>
                  <div>
                    <div className="font-bold text-sm">{p.first_name} {p.last_name}</div>
                    <div className="text-xs text-muted">{p.phone}</div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// =================== ثبت / ویرایش حضور ===================
function AttendanceModal({
  person,
  existing,
  programId,
  programDate,
  onClose,
  onSaved,
}: {
  person: Person;
  existing: Attendance | null;
  programId: string;
  programDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus]   = useState<AttendanceStatus>(existing?.status ?? 'حاضر');
  const [reason, setReason]   = useState(existing?.reason ?? '');
  const [checkIn, setCheckIn] = useState(
    existing?.check_in_time ? new Date(existing.check_in_time).toTimeString().slice(0, 5) : ''
  );
  const [checkOut, setCheckOut] = useState(
    existing?.check_out_time ? new Date(existing.check_out_time).toTimeString().slice(0, 5) : ''
  );
  const [saving, setSaving] = useState(false);

  const buildTs = (timeStr: string): string | null => {
    if (!timeStr) return null;
    return `${programDate}T${timeStr}:00`;
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      program_id: programId,
      person_id: person.id,
      status,
      reason,
      date: programDate,
      check_in_time: checkIn ? buildTs(checkIn) : (status === 'حاضر' || status === 'تاخیر') ? nowISO() : null,
      check_out_time: checkOut ? buildTs(checkOut) : null,
    };

    if (existing) {
      await supabase.from('attendances').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('attendances').insert(payload);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const pills: { s: AttendanceStatus; label: string; cls: string }[] = [
    { s: 'حاضر',  label: '✅ حاضر',  cls: 'pill-present' },
    { s: 'تاخیر', label: '⏰ تاخیر', cls: 'pill-late'    },
    { s: 'غایب',  label: '❌ غایب',  cls: 'pill-absent'  },
  ];

  return (
    <Modal
      title={`ثبت حضور — ${person.first_name} ${person.last_name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'در حال ذخیره...' : '💾 ذخیره'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>انصراف</button>
        </>
      }
    >
      {/* Status Pills */}
      <div className="field mb-16">
        <label>وضعیت *</label>
        <div className="status-pills mt-8">
          {pills.map(({ s, label, cls }) => (
            <button
              key={s}
              className={`status-pill ${cls} ${status === s ? 'selected' : ''}`}
              onClick={() => setStatus(s)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reason (for absent/late) */}
      {(status === 'غایب' || status === 'تاخیر') && (
        <div className="field mb-16">
          <label>علت {status}</label>
          <input
            placeholder={status === 'تاخیر' ? 'مثال: ترافیک' : 'مثال: بیماری'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      )}

      {/* Times */}
      <div className="form-grid">
        <div className="field">
          <label>ساعت ورود</label>
          <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <span className="helper-text">خالی = ثبت ساعت الان</span>
        </div>
        <div className="field">
          <label>ساعت خروج</label>
          <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

// =================== Main Page ===================
export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [program, setProgram]         = useState<Program | null>(null);
  const [participants, setParticipants] = useState<ProgramParticipant[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading]         = useState(true);

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [attModal, setAttModal]   = useState<Person | null>(null);
  const [removeId, setRemoveId]   = useState<string | null>(null);

  useEffect(() => { if (id) fetchAll(); }, [id]);

  async function fetchAll() {
    setLoading(true);
    const [{ data: prog }, { data: parts }, { data: atts }] = await Promise.all([
      supabase.from('programs').select('*').eq('id', id!).single(),
      supabase.from('program_participants').select('*, person:people(*)').eq('program_id', id!),
      supabase.from('attendances').select('*, person:people(*)').eq('program_id', id!),
    ]);

    setProgram(prog as Program);
    setParticipants((parts as ProgramParticipant[]) ?? []);
    setAttendances((atts as Attendance[]) ?? []);
    setLoading(false);
  }

  const getAtt = (personId: string): Attendance | null =>
    attendances.find((a) => a.person_id === personId) ?? null;

  async function removeParticipant(participantId: string) {
    await supabase.from('program_participants').delete().eq('id', participantId);
    setRemoveId(null);
    fetchAll();
  }

  if (loading) return <div className="loading-screen">در حال بارگذاری...</div>;
  if (!program) return <div className="empty-state"><p>برنامه‌ای یافت نشد</p></div>;

  const present = attendances.filter((a) => a.status === 'حاضر').length;
  const late    = attendances.filter((a) => a.status === 'تاخیر').length;
  const absent  = attendances.filter((a) => a.status === 'غایب').length;
  const total   = participants.length;

  return (
    <div>
      {/* Back */}
      <div className="back-bar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/programs')}>
          ← برگشت
        </button>
        <span className="back-crumb">برنامه‌ها / {program.name}</span>
      </div>

      {/* Info Card */}
      <div className="card card-pad mb-24">
        <div className="flex-between">
          <div>
            <h2 className="font-black" style={{ fontSize: 20 }}>{program.name}</h2>
            <p className="text-muted text-sm mt-4">
              📅 {toJalali(program.date)} &nbsp;|&nbsp;
              ⏰ {program.start_time}{program.end_time ? ` تا ${program.end_time}` : ''}
            </p>
            {program.description && (
              <p className="text-sm mt-8">{program.description}</p>
            )}
          </div>
          <div className="flex gap-8 no-print">
            <button
              className="btn btn-info btn-sm"
              onClick={() => printProgramReport(program, attendances)}
            >
              🖨️ چاپ گزارش
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddParticipant(true)}>
              ➕ افزودن فرد
            </button>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="kpi-grid mt-16">
          <div className="kpi-card">
            <div className="kpi-emoji">👥</div>
            <span className="kpi-value" style={{ color: 'var(--primary)' }}>{total}</span>
            <div className="kpi-label">کل شرکت‌کنندگان</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">✅</div>
            <span className="kpi-value" style={{ color: 'var(--good)' }}>{present}</span>
            <div className="kpi-label">حاضر</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">⏰</div>
            <span className="kpi-value" style={{ color: 'var(--warn)' }}>{late}</span>
            <div className="kpi-label">تاخیر</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-emoji">❌</div>
            <span className="kpi-value" style={{ color: 'var(--bad)' }}>{absent}</span>
            <div className="kpi-label">غایب</div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="card">
        <div className="card-pad">
          <h3 className="font-bold mb-16">لیست شرکت‌کنندگان</h3>
        </div>

        {participants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">هنوز فردی اضافه نشده</div>
            <div className="empty-sub">با کلیک بر «افزودن فرد» شروع کنید</div>
          </div>
        ) : (
          <>
            {participants.map(({ id: partId, person }) => {
              const p = person as Person;
              if (!p) return null;
              const att = getAtt(p.id);
              const badge =
                att?.status === 'حاضر'  ? 'badge-good' :
                att?.status === 'تاخیر' ? 'badge-warn' :
                att?.status === 'غایب'  ? 'badge-bad'  : '';

              return (
                <div className="att-row" key={partId}>
                  <div className="att-person">
                    <div className="att-avatar">{p.first_name.charAt(0)}</div>
                    <div>
                      <div className="font-bold text-sm">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-xs text-muted">{p.phone}</div>
                    </div>
                  </div>

                  <div className="flex-center gap-8">
                    {att ? (
                      <>
                        <span className="text-xs text-muted">{formatTime(att.check_in_time)}</span>
                        <span className={`badge ${badge}`}>{att.status}</span>
                        {att.reason && (
                          <span className="text-xs text-muted">({att.reason})</span>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setAttModal(p)}
                        >
                          ✏️ ویرایش
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setAttModal(p)}
                      >
                        ✅ ثبت حضور
                      </button>
                    )}
                    <button
                      className="icon-btn"
                      title="حذف از برنامه"
                      onClick={() => setRemoveId(partId)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <AddParticipantModal
          programId={program.id}
          alreadyIds={participants.map((pt) => pt.person_id)}
          onClose={() => setShowAddParticipant(false)}
          onAdded={fetchAll}
        />
      )}

      {/* Attendance Modal */}
      {attModal && (
        <AttendanceModal
          person={attModal}
          existing={getAtt(attModal.id)}
          programId={program.id}
          programDate={program.date}
          onClose={() => setAttModal(null)}
          onSaved={fetchAll}
        />
      )}

      {/* Remove Confirm */}
      {removeId && (
        <Modal
          title="حذف از برنامه"
          onClose={() => setRemoveId(null)}
          footer={
            <>
              <button className="btn btn-danger" onClick={() => removeParticipant(removeId)}>
                بله، حذف شود
              </button>
              <button className="btn btn-ghost" onClick={() => setRemoveId(null)}>انصراف</button>
            </>
          }
        >
          <p>این فرد از لیست شرکت‌کنندگان حذف می‌شود. رکورد حضور او نیز در صورت وجود باقی می‌ماند.</p>
        </Modal>
      )}
    </div>
  );
}
