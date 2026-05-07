/**
 * Client-side PDF/HTML/CSV helpers for Camelot OS reports
 */

/** Open HTML in a new tab for preview (no auto-print) */
export function openBrochureForPrint(html: string, filename: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups to preview the report.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.document.title = filename.replace(/\.(html|pdf)$/i, '');
}

/** Download HTML string as an .html file */
export function downloadAsHTML(html: string, filename: string): void {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const portableHtml = baseUrl
    ? html
      .replace(/(src|href)=["']\.\/([^"']+)["']/g, `$1="${baseUrl}/$2"`)
      .replace(/(src|href)=["']\/([^"']+)["']/g, `$1="${baseUrl}/$2"`)
      .replace(/srcset=["']([^"']+)["']/g, (_match, value: string) => {
        const rewritten = value
          .split(',')
          .map((entry) => {
            const [url, descriptor] = entry.trim().split(/\s+/, 2);
            const absolute = url.startsWith('/') ? `${baseUrl}${url}` : url.startsWith('./') ? `${baseUrl}/${url.slice(2)}` : url;
            return descriptor ? `${absolute} ${descriptor}` : absolute;
          })
          .join(', ');
        return `srcset="${rewritten}"`;
      })
      .replace(/url\((['"]?)\/([^)'"]+)\1\)/g, `url($1${baseUrl}/$2$1)`)
    : html;
  const blob = new Blob([portableHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Open a mail client with a prepared client-facing draft. Attachments still require manual attachment by the user. */
export function openEmailDraft(params: {
  to?: string;
  cc?: string;
  subject: string;
  body: string;
  preferGmail?: boolean;
}): void {
  const to = encodeURIComponent(params.to || '');
  const cc = params.cc ? `&cc=${encodeURIComponent(params.cc)}` : '';
  const subject = encodeURIComponent(params.subject);
  const body = encodeURIComponent(params.body);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${to}${cc}&su=${subject}&body=${body}`;
  const mailtoUrl = `mailto:${to}?subject=${subject}${cc}&body=${body}`;
  window.open(params.preferGmail === false ? mailtoUrl : gmailUrl, '_blank');
}

/** Download CSV string as a .csv file */
export function triggerCSVDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Copy text to clipboard with fallback */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
