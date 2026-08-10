/** Returns true when the stored file_url is an external/absolute link. */
export const isExternalFileUrl = (fileUrl?: string | null) =>
  !!fileUrl && /^https?:\/\//i.test(fileUrl);

/**
 * Triggers a download/navigation in a way that survives async flows
 * (popup blockers block window.open called after an await).
 */
export const triggerDownload = (url: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 0);
};
