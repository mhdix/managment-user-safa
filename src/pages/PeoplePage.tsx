import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Person, PersonFormData } from '../types';
import Modal from '../components/Modal';

const EMPTY: PersonFormData = { first_name: '', last_name: '', phone: '' };

export default function PeoplePage() {
  const [people, setPeople]       = useState<Person[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [form, setForm]           = useState<PersonFormData>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => { fetchPeople(); }, []);

  async function fetchPeople() {
    setLoading(true);
    const { data } = await supabase
      .from('people')
      .select('*')
      .order('first_name');
    setPeople((data as Person[]) ?? []);
    setLoading(false);
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Person) {
    setEditTarget(p);
    setForm({ first_name: p.first_name, last_name: p.last_name, phone: p.phone });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    setError('');
    if (!form.first_name.trim()) { setError('نام الزامی است'); return; }
    if (!form.last_name.trim())  { setError('نام‌خانوادگی الزامی است'); return; }
    if (!form.phone.trim())      { setError('شماره تلفن الزامی است'); return; }

    setSaving(true);
    if (editTarget) {
      await supabase.from('people').update(form).eq('id', editTarget.id);
    } else {
      await supabase.from('people').insert(form);
    }
    setSaving(false);
    setShowModal(false);
    fetchPeople();
  }

  async function handleDelete(id: string) {
    await supabase.from('people').delete().eq('id', id);
    setDeleteId(null);
    fetchPeople();
  }

  const filtered = people.filter(
    (p) =>
      `${p.first_name} ${p.last_name}`.includes(search) ||
      p.phone.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="section-header mb-24">
        <h2>👥 افراد</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          ➕ افزودن فرد
        </button>
      </div>

      {/* Search */}
      <div className="mb-16">
        <input
          placeholder="🔍 جستجو بر اساس نام یا شماره..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 380 }}
        />
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-muted mb-16">
          {filtered.length} نفر از {people.length} نفر
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>در حال بارگذاری...</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">فردی یافت نشد</div>
            <div className="empty-sub">اولین فرد را اضافه کنید</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((p) => (
            <div className="person-card" key={p.id}>
              <div className="flex-center gap-12">
                <div className="att-avatar" style={{ width: 44, height: 44, borderRadius: 14, fontSize: 16 }}>
                  {p.first_name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{p.first_name} {p.last_name}</div>
                  <div className="text-sm text-muted">📞 {p.phone}</div>
                </div>
              </div>
              <div className="flex gap-8">
                <Link to={`/people/${p.id}`} className="btn btn-light btn-sm">
                  👤 پروفایل
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                  ✏️ ویرایش
                </button>
                <button className="icon-btn" onClick={() => setDeleteId(p.id)} title="حذف">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editTarget ? 'ویرایش فرد' : 'افزودن فرد جدید'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'در حال ذخیره...' : editTarget ? '💾 ذخیره' : '✅ افزودن'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>انصراف</button>
            </>
          }
        >
          {error && <div className="error-box mb-16">⚠️ {error}</div>}
          <div className="form-grid">
            <div className="field">
              <label>نام *</label>
              <input
                placeholder="مثال: علی"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>نام‌خانوادگی *</label>
              <input
                placeholder="مثال: محمدی"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </div>
            <div className="field form-full">
              <label>شماره تلفن *</label>
              <input
                placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal
          title="حذف فرد"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                🗑️ بله، حذف شود
              </button>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>انصراف</button>
            </>
          }
        >
          <p>آیا مطمئن هستید؟ تمام رکوردهای حضور این فرد هم حذف می‌شود.</p>
        </Modal>
      )}
    </div>
  );
}
