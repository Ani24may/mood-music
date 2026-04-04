/**
 * Generates a beautiful shareable card image on canvas.
 * Returns a Blob (image/png).
 */

const CARD_W = 1080;
const CARD_H = 1350;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function wrapText(ctx, text, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateShareCard({ mood, song, story }) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");

  // === BACKGROUND ===
  // Dark gradient
  const bgGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bgGrad.addColorStop(0, "#0a0a10");
  bgGrad.addColorStop(0.5, "#0e0c14");
  bgGrad.addColorStop(1, "#08080e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Ambient glow spots
  const drawGlow = (x, y, radius, color) => {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  drawGlow(200, 300, 350, "rgba(212, 168, 83, 0.06)");
  drawGlow(880, 900, 400, "rgba(120, 80, 180, 0.05)");
  drawGlow(540, 600, 300, "rgba(212, 168, 83, 0.03)");

  // Subtle decorative particles
  ctx.fillStyle = "rgba(212, 168, 83, 0.15)";
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * CARD_W;
    const py = Math.random() * CARD_H;
    const ps = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(px, py, ps, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thin border frame
  const pad = 40;
  drawRoundedRect(ctx, pad, pad, CARD_W - pad * 2, CARD_H - pad * 2, 24);
  ctx.strokeStyle = "rgba(212, 168, 83, 0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const contentX = 80;
  const contentW = CARD_W - contentX * 2;
  let cursorY = 100;

  // === BRAND ===
  ctx.font = "500 14px Inter, sans-serif";
  ctx.fillStyle = "rgba(184, 168, 138, 0.7)";
  ctx.letterSpacing = "6px";
  ctx.textAlign = "center";
  ctx.fillText("MOOD MUSIC", CARD_W / 2, cursorY);
  cursorY += 20;

  // Decorative line
  const lineGrad = ctx.createLinearGradient(contentX + 100, 0, CARD_W - contentX - 100, 0);
  lineGrad.addColorStop(0, "transparent");
  lineGrad.addColorStop(0.5, "rgba(212, 168, 83, 0.3)");
  lineGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentX + 100, cursorY);
  ctx.lineTo(CARD_W - contentX - 100, cursorY);
  ctx.stroke();
  cursorY += 50;

  // === MOOD QUOTE ===
  ctx.textAlign = "center";
  ctx.font = "italic 300 26px Inter, sans-serif";
  ctx.fillStyle = "rgba(122, 115, 104, 0.9)";
  const moodLines = wrapText(ctx, `\u201C${mood}\u201D`, contentW - 40, 36);
  for (const line of moodLines) {
    ctx.fillText(line, CARD_W / 2, cursorY);
    cursorY += 36;
  }
  cursorY += 30;

  // === ALBUM ART ===
  const artSize = 280;
  const artX = (CARD_W - artSize) / 2;
  const artY = cursorY;

  // Album art shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;

  // Draw rounded album art
  drawRoundedRect(ctx, artX, artY, artSize, artSize, 16);
  ctx.clip();

  if (song.image) {
    try {
      const albumImg = await loadImage(song.image);
      ctx.drawImage(albumImg, artX, artY, artSize, artSize);
    } catch {
      // Fallback: dark box with music note
      ctx.fillStyle = "#141418";
      ctx.fillRect(artX, artY, artSize, artSize);
      ctx.font = "80px serif";
      ctx.fillStyle = "rgba(212, 168, 83, 0.3)";
      ctx.textAlign = "center";
      ctx.fillText("\u266B", CARD_W / 2, artY + artSize / 2 + 28);
    }
  } else {
    ctx.fillStyle = "#141418";
    ctx.fillRect(artX, artY, artSize, artSize);
    ctx.font = "80px serif";
    ctx.fillStyle = "rgba(212, 168, 83, 0.3)";
    ctx.textAlign = "center";
    ctx.fillText("\u266B", CARD_W / 2, artY + artSize / 2 + 28);
  }

  // Reset clip & shadow
  ctx.restore?.();
  ctx.save?.();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Need to reset the clipping — recreate context state
  // Since canvas clip can't be "unclipped", we work around by
  // re-setting the full canvas as clip
  canvas.width = canvas.width; // reset
  // Redraw everything we had...
  // Actually, let's restructure to draw album art last or use save/restore properly.

  // --- Let's redo this properly with save/restore ---
  return generateShareCardProper({ mood, song, story });
}

/**
 * Proper implementation with save/restore for clipping.
 */
export async function generateShareCardProper({ mood, song, story }) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");

  // === BACKGROUND ===
  const bgGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bgGrad.addColorStop(0, "#0a0a10");
  bgGrad.addColorStop(0.5, "#0e0c14");
  bgGrad.addColorStop(1, "#08080e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Ambient glows
  const drawGlow = (x, y, radius, color) => {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  drawGlow(200, 300, 350, "rgba(212, 168, 83, 0.06)");
  drawGlow(880, 900, 400, "rgba(120, 80, 180, 0.05)");
  drawGlow(540, 600, 300, "rgba(212, 168, 83, 0.03)");

  // Particles
  ctx.fillStyle = "rgba(212, 168, 83, 0.15)";
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * CARD_W;
    const py = Math.random() * CARD_H;
    const ps = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(px, py, ps, 0, Math.PI * 2);
    ctx.fill();
  }

  // Border frame
  const pad = 40;
  drawRoundedRect(ctx, pad, pad, CARD_W - pad * 2, CARD_H - pad * 2, 24);
  ctx.strokeStyle = "rgba(212, 168, 83, 0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const contentX = 80;
  const contentW = CARD_W - contentX * 2;
  let y = 100;

  // === BRAND ===
  ctx.textAlign = "center";
  ctx.font = "600 15px Inter, sans-serif";
  ctx.fillStyle = "rgba(184, 168, 138, 0.6)";
  ctx.fillText("M O O D   M U S I C", CARD_W / 2, y);
  y += 22;

  // Decorative line
  const lineGrad = ctx.createLinearGradient(contentX + 100, 0, CARD_W - contentX - 100, 0);
  lineGrad.addColorStop(0, "transparent");
  lineGrad.addColorStop(0.5, "rgba(212, 168, 83, 0.3)");
  lineGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentX + 100, y);
  ctx.lineTo(CARD_W - contentX - 100, y);
  ctx.stroke();
  y += 55;

  // === MOOD QUOTE ===
  ctx.textAlign = "center";
  ctx.font = "italic 300 28px Inter, sans-serif";
  ctx.fillStyle = "rgba(122, 115, 104, 0.9)";
  const moodLines = wrapText(ctx, `\u201C${mood}\u201D`, contentW - 40, 40);
  for (const line of moodLines) {
    ctx.fillText(line, CARD_W / 2, y);
    y += 40;
  }
  y += 35;

  // === ALBUM ART (with clipping) ===
  const artSize = 300;
  const artX = (CARD_W - artSize) / 2;
  const artY = y;

  // Shadow behind art
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 15;
  drawRoundedRect(ctx, artX, artY, artSize, artSize, 16);
  ctx.fillStyle = "#141418";
  ctx.fill();
  ctx.restore();

  // Draw image clipped to rounded rect
  ctx.save();
  drawRoundedRect(ctx, artX, artY, artSize, artSize, 16);
  ctx.clip();

  if (song.image) {
    try {
      const albumImg = await loadImage(song.image);
      ctx.drawImage(albumImg, artX, artY, artSize, artSize);
    } catch {
      ctx.fillStyle = "#141418";
      ctx.fillRect(artX, artY, artSize, artSize);
      ctx.font = "80px serif";
      ctx.fillStyle = "rgba(212, 168, 83, 0.3)";
      ctx.textAlign = "center";
      ctx.fillText("\u266B", CARD_W / 2, artY + artSize / 2 + 28);
    }
  } else {
    ctx.fillStyle = "#141418";
    ctx.fillRect(artX, artY, artSize, artSize);
    ctx.font = "80px serif";
    ctx.fillStyle = "rgba(212, 168, 83, 0.3)";
    ctx.textAlign = "center";
    ctx.fillText("\u266B", CARD_W / 2, artY + artSize / 2 + 28);
  }
  ctx.restore();

  // Subtle gold border on album art
  drawRoundedRect(ctx, artX, artY, artSize, artSize, 16);
  ctx.strokeStyle = "rgba(212, 168, 83, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  y = artY + artSize + 40;

  // === SONG NAME ===
  ctx.textAlign = "center";
  ctx.font = "600 36px Inter, sans-serif";
  ctx.fillStyle = "#f5e6c8";
  const titleLines = wrapText(ctx, song.name, contentW, 44);
  for (const line of titleLines) {
    ctx.fillText(line, CARD_W / 2, y);
    y += 44;
  }
  y += 4;

  // === ARTIST ===
  ctx.font = "400 22px Inter, sans-serif";
  ctx.fillStyle = "rgba(160, 125, 58, 0.9)";
  ctx.fillText(song.artist, CARD_W / 2, y);
  y += 45;

  // === AI STORY ===
  if (story) {
    // Subtle divider
    const divGrad = ctx.createLinearGradient(contentX + 60, 0, CARD_W - contentX - 60, 0);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.5, "rgba(212, 168, 83, 0.2)");
    divGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(contentX + 60, y);
    ctx.lineTo(CARD_W - contentX - 60, y);
    ctx.stroke();
    y += 30;

    ctx.font = "italic 300 20px Inter, sans-serif";
    ctx.fillStyle = "rgba(122, 115, 104, 0.8)";
    const storyLines = wrapText(ctx, story, contentW - 20, 30);
    // Limit to ~6 lines to fit card
    const displayLines = storyLines.slice(0, 6);
    for (const line of displayLines) {
      ctx.fillText(line, CARD_W / 2, y);
      y += 30;
    }
  }

  // === WATERMARK — Bottom ===
  // Background strip
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(pad, CARD_H - pad - 50, CARD_W - pad * 2, 50);

  // App URL — prominent but tasteful
  ctx.textAlign = "center";
  ctx.font = "600 16px Inter, sans-serif";
  ctx.fillStyle = "rgba(92, 224, 216, 0.7)";
  ctx.fillText("mood-music-ebon.vercel.app", CARD_W / 2, CARD_H - pad - 28);

  // Tagline
  ctx.font = "300 11px Inter, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.fillText("Type your mood. Get the perfect song.", CARD_W / 2, CARD_H - pad - 10);

  // === WATERMARK — Top corner ===
  ctx.textAlign = "right";
  ctx.font = "500 12px Inter, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillText("moodmusic", CARD_W - pad - 10, pad + 20);

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Share or download the card.
 * Uses Web Share API if available (mobile), falls back to download.
 */
export async function shareOrDownload({ mood, song, story }) {
  const blob = await generateShareCardProper({ mood, song, story });

  if (!blob) return;

  const file = new File([blob], "mood-music.png", { type: "image/png" });

  // Try Web Share API (works on mobile)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: "Mood Music",
        text: `"${mood}" \u2014 ${song.name} by ${song.artist}\n\n${song.spotify_url || ""}\n\nhttps://mood-music-ebon.vercel.app`.trim(),
        files: [file],
      });
      return "shared";
    } catch (err) {
      if (err.name === "AbortError") return "cancelled";
      // Fall through to download
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mood-music-${song.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return "downloaded";
}
