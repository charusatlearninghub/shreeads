export interface CertificateHtmlOptions {
  courseTitle: string;
  userName: string;
  issuedDate: string;
  certificateNumber: string;
  /** Renders a diagonal PREVIEW watermark and hides the auto-print script. */
  isPreview?: boolean;
  /** Automatically opens the browser print dialog on load. */
  autoPrint?: boolean;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );

/**
 * Single source of truth for the certificate markup used by both the
 * in-app preview (watermarked, non-downloadable) and the real download.
 */
export function buildCertificateHtml({
  courseTitle,
  userName,
  issuedDate,
  certificateNumber,
  isPreview = false,
  autoPrint = false,
}: CertificateHtmlOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Certificate - ${escapeHtml(courseTitle)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; padding: 20px; }
  .certificate { width: 800px; height: 600px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 40px; position: relative; overflow: hidden; }
  .certificate-inner { background: white; border-radius: 12px; height: 100%; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; overflow: hidden; }
  .certificate-inner::before { content: ''; position: absolute; inset: 8px; border: 2px solid #e5e7eb; border-radius: 8px; pointer-events: none; }
  .award-icon { width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
  .award-icon svg { width: 40px; height: 40px; fill: white; }
  .title { font-family: 'Playfair Display', serif; font-size: 14px; text-transform: uppercase; letter-spacing: 4px; color: #6b7280; margin-bottom: 8px; }
  .course-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 24px; max-width: 500px; }
  .presented-to { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 8px; }
  .recipient-name { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 24px; }
  .description { font-size: 14px; color: #6b7280; max-width: 400px; line-height: 1.6; margin-bottom: 32px; }
  .footer { display: flex; justify-content: space-between; width: 100%; max-width: 500px; }
  .footer-item { text-align: center; }
  .footer-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 4px; }
  .footer-value { font-size: 12px; color: #374151; font-weight: 500; }
  .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .watermark span { font-family: 'Playfair Display', serif; font-size: 120px; font-weight: 700; letter-spacing: 12px; color: rgba(102, 126, 234, 0.16); transform: rotate(-24deg); white-space: nowrap; }
  @media print { body { background: white; padding: 0; } .certificate { box-shadow: none; } }
</style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-inner">
      <div class="award-icon">
        <svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
      </div>
      <p class="title">Certificate of Completion</p>
      <h1 class="course-title">${escapeHtml(courseTitle)}</h1>
      <p class="presented-to">Presented to</p>
      <h2 class="recipient-name">${escapeHtml(userName)}</h2>
      <p class="description">For successfully completing all lessons and demonstrating proficiency in the course curriculum.</p>
      <div class="footer">
        <div class="footer-item">
          <p class="footer-label">Date Issued</p>
          <p class="footer-value">${escapeHtml(issuedDate)}</p>
        </div>
        <div class="footer-item">
          <p class="footer-label">Certificate ID</p>
          <p class="footer-value">${escapeHtml(certificateNumber)}</p>
        </div>
      </div>
      ${isPreview ? '<div class="watermark"><span>PREVIEW</span></div>' : ''}
    </div>
  </div>
  ${autoPrint ? '<script>window.onload = () => window.print();<\/script>' : ''}
</body>
</html>`;
}
