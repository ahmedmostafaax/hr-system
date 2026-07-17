export interface CredentialsExportLabels {
  title: string;
  subtitle: string;
  name: string;
  email: string;
  role?: string;
  password: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCredentialsHtml(labels: CredentialsExportLabels, isAr: boolean) {
  const dir = isAr ? "rtl" : "ltr";
  const roleRow = labels.role
    ? `<p style="margin:0 0 10px;font-size:14px;color:#334155;">
        <span style="color:#64748b;">${isAr ? "الدور:" : "Role:"}</span>
        <strong>${escapeHtml(labels.role)}</strong>
      </p>`
    : "";

  return `
    <div dir="${dir}" style="width:400px;padding:28px;background:#ffffff;color:#1e293b;font-family:Segoe UI,Tahoma,Arial,sans-serif;box-sizing:border-box;">
      <h2 style="margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:18px;font-weight:700;color:#0f172a;">
        ${escapeHtml(labels.title)}
      </h2>
      <div style="margin-bottom:18px;padding:12px 14px;border:1px solid #fde68a;border-radius:10px;background:#fffbeb;color:#92400e;font-size:13px;line-height:1.5;">
        ${escapeHtml(labels.subtitle)}
      </div>
      <p style="margin:0 0 10px;font-size:14px;color:#334155;">
        <span style="color:#64748b;">${isAr ? "الاسم:" : "Name:"}</span>
        <strong>${escapeHtml(labels.name)}</strong>
      </p>
      <p style="margin:0 0 10px;font-size:14px;color:#334155;">
        <span style="color:#64748b;">${isAr ? "البريد:" : "Email:"}</span>
        <strong>${escapeHtml(labels.email)}</strong>
      </p>
      ${roleRow}
      <div style="margin-top:14px;padding:14px 16px;border-radius:10px;background:#eef2ff;">
        <div style="font-size:12px;color:#64748b;margin-bottom:6px;">${isAr ? "كلمة المرور:" : "Password:"}</div>
        <div style="font-family:Consolas,Monaco,monospace;font-size:18px;font-weight:700;letter-spacing:0.05em;color:#4338ca;word-break:break-all;">
          ${escapeHtml(labels.password)}
        </div>
      </div>
    </div>
  `;
}

async function renderCredentialsCanvas(
  labels: CredentialsExportLabels,
  isAr: boolean
): Promise<HTMLCanvasElement> {
  const html = buildCredentialsHtml(labels, isAr);
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;background:#ffffff;";
  host.innerHTML = html;
  document.body.appendChild(host);

  try {
    const target = host.firstElementChild as HTMLElement;
    const html2canvas = (await import("html2canvas")).default;
    return await html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });
  } finally {
    document.body.removeChild(host);
  }
}

export async function downloadCredentialsImage(
  labels: CredentialsExportLabels,
  isAr: boolean,
  filename: string
) {
  const canvas = await renderCredentialsCanvas(labels, isAr);
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function downloadCredentialsPdf(
  labels: CredentialsExportLabels,
  isAr: boolean,
  filename: string
) {
  const canvas = await renderCredentialsCanvas(labels, isAr);
  const { jsPDF } = await import("jspdf");
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
}

export function printCredentials(labels: CredentialsExportLabels, isAr: boolean) {
  const html = buildCredentialsHtml(labels, isAr);
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("POPUP_BLOCKED");
  }

  win.document.write(`<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(labels.title)}</title>
    <style>
      body { margin: 0; padding: 24px; display: flex; justify-content: center; background: #fff; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>${html}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}
