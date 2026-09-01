/** Returns true when the stored file_url is an external/absolute link. */
export const isExternalFileUrl = (fileUrl?: string | null) =>
  !!fileUrl && /^https?:\/\//i.test(fileUrl);

/**
 * Opens an external/third-party link (Mediafire, GitHub releases, etc.).
 * Uses an anchor + target=_blank so the origin site handles the download.
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

/**
 * Starts a download for a URL that already returns
 * `Content-Disposition: attachment` (e.g. a Supabase signed URL created with
 * the `download` option).
 *
 * Chrome/Edge block cross-origin downloads that are initiated from a
 * `target="_blank"` anchor without a user gesture in the new tab, which is why
 * we navigate the current document instead. Because the response is an
 * attachment, the page itself never navigates away.
 */
export const startAttachmentDownload = (url: string) => {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 60_000);
  } catch {
    window.location.href = url;
  }
};
