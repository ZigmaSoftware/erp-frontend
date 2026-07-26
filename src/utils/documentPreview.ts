const releaseObjectUrlWhenClosed = (
  popup: Window | null,
  url: string,
  revokeUrl: boolean,
) => {
  if (!revokeUrl) return;

  if (!popup) {
    URL.revokeObjectURL(url);
    return;
  }

  const timer = window.setInterval(() => {
    if (popup.closed) {
      window.clearInterval(timer);
      URL.revokeObjectURL(url);
    }
  }, 1000);

  window.setTimeout(() => {
    window.clearInterval(timer);
    URL.revokeObjectURL(url);
  }, 10 * 60 * 1000);
};

export const openDocumentPopup = (
  url: string,
  fileName: string,
  mimeType: string,
  revokeUrl = false,
) => {
  const width = 850;
  const height = 650;
  const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
  const features = [
    "popup=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  const popup = window.open("", "noc-document-preview", features);
  if (!popup) {
    const fallback = window.open(url, "_blank", "noopener,noreferrer");
    releaseObjectUrlWhenClosed(fallback, url, revokeUrl);
    return;
  }

  const popupDocument = popup.document;
  popupDocument.title = fileName || "Document Preview";
  popupDocument.documentElement.style.height = "100%";
  popupDocument.body.replaceChildren();
  popupDocument.body.style.cssText =
    "margin:0; min-height:100%; overflow:auto; background:#202124; font-family:Arial,sans-serif;";

  const isImage =
    mimeType.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(fileName);
  const isPdf = mimeType === "application/pdf" || /\.pdf$/i.test(fileName);

  if (isImage) {
    const image = popupDocument.createElement("img");
    image.src = url;
    image.alt = fileName || "Document preview";
    image.style.cssText =
      "display:block; width:100%; height:calc(100vh - 16px); max-width:100%; object-fit:contain; background:#202124;";
    popupDocument.body.appendChild(image);
  } else if (isPdf) {
    const frame = popupDocument.createElement("iframe");
    frame.src = url;
    frame.title = fileName || "PDF preview";
    frame.style.cssText =
      "display:block; width:100%; height:calc(100vh - 16px); min-height:600px; border:0; background:#fff;";
    popupDocument.body.appendChild(frame);
  } else {
    popupDocument.body.style.background = "#fff";
    const wrapper = popupDocument.createElement("main");
    wrapper.style.cssText =
      "display:flex; min-height:100vh; align-items:center; justify-content:center; padding:24px; box-sizing:border-box;";
    const download = popupDocument.createElement("a");
    download.href = url;
    download.download = fileName || "document";
    download.textContent = `Download ${fileName || "document"}`;
    download.style.cssText =
      "display:inline-block; padding:12px 20px; border-radius:6px; background:#111827; color:#fff; text-decoration:none;";
    wrapper.appendChild(download);
    popupDocument.body.appendChild(wrapper);
  }

  popup.focus();
  releaseObjectUrlWhenClosed(popup, url, revokeUrl);
};
