import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toJalali } from "../utils/date";
import type { Program, ProgramFormData } from "../types";
import Modal from "../components/Modal";

const EMPTY_FORM: ProgramFormData = {
  name: "",
  description: "",
  date: "",
  start_time: "",
  end_time: "",
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Program | null>(null);
  const [form, setForm] = useState<ProgramFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  async function fetchPrograms() {
    setLoading(true);
    const { data } = await supabase
      .from("programs")
      .select("*")
      .order("date", { ascending: false });
    setPrograms((data as Program[]) ?? []);
    setLoading(false);
  }

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setShowModal(true);
  }

  function openEdit(p: Program) {
    setEditTarget(p);
    setForm({
      name: p.name,
      description: p.description,
      date: p.date,
      start_time: p.start_time,
      end_time: p.end_time ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.date || !form.start_time) return;
    setSaving(true);
    if (editTarget) {
      await supabase
        .from("programs")
        .update({ ...form, end_time: form.end_time || null })
        .eq("id", editTarget.id);
    } else {
      await supabase
        .from("programs")
        .insert({ ...form, end_time: form.end_time || null });
    }
    setSaving(false);
    setShowModal(false);
    fetchPrograms();
  }

  async function handleDelete(id: string) {
    await supabase.from("programs").delete().eq("id", id);
    setDeleteId(null);
    fetchPrograms();
  }

  const filtered = programs.filter(
    (p) => p.name.includes(search) || p.description.includes(search),
  );

  const field = (
    key: keyof ProgramFormData,
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <div className="field">
      <label>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={(form[key] as string) ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div>
      <div className="section-header mb-24">
        <h2>📅 برنامه‌ها</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          ➕ برنامه جدید
        </button>
      </div>

      <div className="mb-16">
        <input
          placeholder="🔍 جستجو در برنامه‌ها..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          در حال بارگذاری...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <div className="empty-title">برنامه‌ای یافت نشد</div>
            <div className="empty-sub">اولین برنامه را اضافه کنید</div>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>نام برنامه</th>
                <th>تاریخ</th>
                <th>ساعت شروع</th>
                <th>ساعت پایان</th>
                <th>توضیحات</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold">{p.name}</td>
                  <td>{toJalali(p.date)}</td>
                  <td>{p.start_time}</td>
                  <td>{p.end_time ?? "—"}</td>
                  <td className="text-muted text-sm">{p.description || "—"}</td>
                  <td>
                    <div className="flex gap-6">
                      <Link
                        to={`/programs/${p.id}`}
                        className="btn btn-light btn-sm"
                      >
                        🔍 جزئیات
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(p)}
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteId(p.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal
          title={editTarget ? "ویرایش برنامه" : "برنامه جدید"}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "در حال ذخیره..."
                  : editTarget
                    ? "💾 ذخیره تغییرات"
                    : "✅ ایجاد برنامه"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
              >
                انصراف
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-full">
              {field("name", "نام برنامه *", "text", "مثال: کلاس React")}
            </div>
            {field("date", "تاریخ *", "date")}
            {field("start_time", "ساعت شروع *", "time")}
            {field("end_time", "ساعت پایان", "time")}
            <div className="form-full">
              <div className="field">
                <label>توضیحات</label>
                <textarea
                  rows={3}
                  placeholder="توضیحات اختیاری..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal
          title="حذف برنامه"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteId)}
              >
                🗑️ بله، حذف شود
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteId(null)}
              >
                انصراف
              </button>
            </>
          }
        >
          <p>آیا مطمئن هستید؟ تمام رکوردهای حضور این برنامه هم حذف می‌شود.</p>
        </Modal>
      )}
    </div>
  );
}
