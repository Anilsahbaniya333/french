/**
 * Shared video URL utilities — used by VideoEmbed and TopicEditor.
 * Handles YouTube, Vimeo, and direct video files.
 */

/** Extract YouTube video ID from any YouTube URL variant. */
export function getYouTubeId(url: string): string | null {
  try {
    const m = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/
    );
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Extract Vimeo video ID from either:
 *   https://vimeo.com/{id}
 *   https://player.vimeo.com/video/{id}
 */
export function getVimeoId(url: string): string | null {
  try {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Normalise any Vimeo URL to the embed form:
 *   https://player.vimeo.com/video/{id}
 * Non-Vimeo URLs are returned unchanged.
 */
export function normalizeVimeoUrl(url: string): string {
  const id = getVimeoId(url);
  if (!id) return url;
  return `https://player.vimeo.com/video/${id}`;
}

/** True for direct video file URLs (Supabase Storage uploads or raw mp4/webm/ogg). */
export function isDirectVideo(url: string): boolean {
  return (
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ||
    url.includes("/storage/v1/object/public/")
  );
}

/**
 * True for OneDrive / SharePoint / Teams recording links.
 * These cannot be embedded — render as a "Watch Recording" button instead.
 */
export function isRecordingLink(url: string): boolean {
  return (
    url.includes("sharepoint.com") ||
    url.includes("1drv.ms") ||
    url.includes("onedrive.live.com") ||
    url.includes("teams.microsoft.com") ||
    url.includes("microsoftstream.com")
  );
}
