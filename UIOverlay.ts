// UIOverlay.ts

export function showInfoOverlay(
  id: string,
  title: string,
  body: string,
  buttonLabel = "OK",
  onClose?: () => void,
) {
  let overlay = document.getElementById(id) as HTMLDivElement | null;

  // Create overlay structure once
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = id;
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.zIndex = "9990";

    const box = document.createElement("div");
    box.id = `${id}-box`;
    box.style.padding = "24px 32px";
    box.style.borderRadius = "16px";
    box.style.backgroundColor = "#ffdd77";
    box.style.boxShadow = "0 0 20px rgba(0,0,0,0.6)";
    box.style.fontFamily = `"Impact", "Arial Black", system-ui`;
    box.style.maxWidth = "480px";
    box.style.textAlign = "center";
    box.style.color = "#331100";

    const titleEl = document.createElement("div");
    titleEl.id = `${id}-title`;
    titleEl.style.fontSize = "32px";
    titleEl.style.marginBottom = "12px";
    titleEl.style.letterSpacing = "2px";
    titleEl.style.textTransform = "uppercase";

    const bodyEl = document.createElement("div");
    bodyEl.id = `${id}-body`;
    bodyEl.style.fontSize = "18px";
    bodyEl.style.marginBottom = "18px";
    bodyEl.style.lineHeight = "1.4";

    const button = document.createElement("button");
    button.id = `${id}-button`;
    button.style.padding = "8px 20px";
    button.style.borderRadius = "999px";
    button.style.border = "none";
    button.style.backgroundColor = "#ff7a7a";
    button.style.color = "#331100";
    button.style.fontSize = "18px";
    button.style.cursor = "pointer";

    box.appendChild(titleEl);
    box.appendChild(bodyEl);
    box.appendChild(button);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const close = () => {
      overlay!.style.display = "none";
      if (onClose) onClose();
    };

    button.addEventListener("click", close);

    // Click outside the box also closes
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        close();
      }
    });
  }

  const titleEl = document.getElementById(`${id}-title`);
  const bodyEl = document.getElementById(`${id}-body`);
  const buttonEl = document.getElementById(`${id}-button`);

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.textContent = body;
  if (buttonEl && buttonLabel) buttonEl.textContent = buttonLabel;

  overlay!.style.display = "flex";
}
