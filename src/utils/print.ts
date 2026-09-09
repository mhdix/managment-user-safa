import type { Attendance, Program, Person } from '../types';
import { toJalali, formatTime, formatDuration, durationMinutes } from './date';


export function printProgramReport(
  program: Program,
  attendances: Attendance[]
): void {
  const rows = attendances
    .map((a) => {
      const name = a.person
        ? `${a.person.first_name} ${a.person.last_name}`
        : '—';
      const dur = formatDuration(
        durationMinutes(a.check_in_time, a.check_out_time)
      );
      const statusColor =
        a.status === 'حاضر'
          ? '#0f9d67'
          : a.status === 'تاخیر'
            ? '#d88a13'
            : '#d9465f';
      return `
        <tr>
          <td>${name}</td>
          <td style="color:${statusColor};font-weight:700">${a.status}</td>
          <td>${formatTime(a.check_in_time)}</td>
          <td>${formatTime(a.check_out_time)}</td>
          <td>${dur}</td>
          <td>${a.reason || '—'}</td>
        </tr>`;
    })
    .join('');

  const html = buildPrintHtml(
    `گزارش حضور و غیاب — ${program.name}`,
    `تاریخ: ${toJalali(program.date)} | ساعت: ${program.start_time}${program.end_time ? ' تا ' + program.end_time : ''}`,
    `<table>
      <thead>
        <tr>
          <th>نام و نام‌خانوادگی</th>
          <th>وضعیت</th>
          <th>ساعت ورود</th>
          <th>ساعت خروج</th>
          <th>مدت حضور</th>
          <th>علت</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
  );

  openPrintWindow(html);
}


export function printPersonReport(
  person: Person,
  attendances: Attendance[]
): void {
  const total = attendances.length;
  const present = attendances.filter((a) => a.status === 'حاضر').length;
  const absent = attendances.filter((a) => a.status === 'غایب').length;
  const late = attendances.filter((a) => a.status === 'تاخیر').length;
  const pct = total ? Math.round((present / total) * 100) : 0;

  const rows = attendances
    .map((a) => {
      const statusColor =
        a.status === 'حاضر'
          ? '#0f9d67'
          : a.status === 'تاخیر'
            ? '#d88a13'
            : '#d9465f';
      return `
        <tr>
          <td>${a.program?.name ?? '—'}</td>
          <td>${toJalali(a.date)}</td>
          <td style="color:${statusColor};font-weight:700">${a.status}</td>
          <td>${formatTime(a.check_in_time)}</td>
          <td>${formatTime(a.check_out_time)}</td>
          <td>${a.reason || '—'}</td>
        </tr>`;
    })
    .join('');

  const html = buildPrintHtml(
    `پروفایل حضور — ${person.first_name} ${person.last_name}`,
    `تلفن: ${person.phone} | حاضر: ${present} | غایب: ${absent} | تاخیر: ${late} | درصد حضور: ${pct}%`,
    `<table>
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
      <tbody>${rows}</tbody>
    </table>`
  );

  openPrintWindow(html);
}


export function printFullReport(attendances: Attendance[]): void {
  const rows = attendances
    .map((a) => {
      const name = a.person
        ? `${a.person.first_name} ${a.person.last_name}`
        : '—';
      const statusColor =
        a.status === 'حاضر'
          ? '#0f9d67'
          : a.status === 'تاخیر'
            ? '#d88a13'
            : '#d9465f';
      return `
        <tr>
          <td>${name}</td>
          <td>${a.program?.name ?? '—'}</td>
          <td>${toJalali(a.date)}</td>
          <td style="color:${statusColor};font-weight:700">${a.status}</td>
          <td>${formatTime(a.check_in_time)}</td>
          <td>${formatTime(a.check_out_time)}</td>
          <td>${a.reason || '—'}</td>
        </tr>`;
    })
    .join('');

  const html = buildPrintHtml(
    'گزارش کلی حضور و غیاب',
    `تعداد رکورد: ${attendances.length}`,
    `<table>
      <thead>
        <tr>
          <th>نام</th>
          <th>برنامه</th>
          <th>تاریخ</th>
          <th>وضعیت</th>
          <th>ساعت ورود</th>
          <th>ساعت خروج</th>
          <th>علت</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
  );

  openPrintWindow(html);
}

// ==============================
// helpers داخلی
// ==============================

function buildPrintHtml(title: string, subtitle: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;padding:28px;color:#172033;font-size:13px}
    h1{font-size:20px;font-weight:800;margin-bottom:4px}
    p.sub{color:#718096;font-size:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse}
    th,td{padding:10px 12px;border:1px solid #d0d9ee;text-align:right}
    th{background:#f0f4fd;font-weight:700;font-size:11px;color:#59667a}
    tr:nth-child(even) td{background:#fafbff}
    .footer{margin-top:20px;font-size:11px;color:#a0aec0;text-align:left}
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="sub">${subtitle}</p>
  ${content}
  <div class="footer">تاریخ چاپ: ${new Date().toLocaleString('fa-IR')}</div>
  <script>window.onload=()=>window.print();</script>
</body>
</html>`;
}

function openPrintWindow(html: string): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('پنجره باز نشد. Pop-up را در مرورگر فعال کنید.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
