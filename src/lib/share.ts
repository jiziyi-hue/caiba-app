export async function shareUrl(url: string, title: string, text?: string): Promise<void> {
  if (navigator.share) {
    await navigator.share({ title, text: text ?? title, url });
  } else {
    await navigator.clipboard.writeText(url).catch(() => {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
  }
}
