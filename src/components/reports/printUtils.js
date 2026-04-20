export async function generatePDF(element, filename = "relatorio.pdf") {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const restores = [];

  // Remove margin:auto so element sits at x=0 in its parent (avoids offset in capture)
  const origMargin = element.style.margin;
  element.style.margin = "0";
  restores.push(() => { element.style.margin = origMargin; });

  // Walk ancestors: remove scale transform and unclip overflow containers
  let el = element.parentElement;
  while (el && el !== document.body) {
    const cs = window.getComputedStyle(el);

    if (cs.transform !== "none") {
      const orig = { transform: el.style.transform, width: el.style.width };
      // Give parent enough width so max-width content can render at full size
      el.style.transform = "none";
      el.style.width = "1400px";
      restores.push(() => { el.style.transform = orig.transform; el.style.width = orig.width; });
    }

    if (["auto", "scroll", "hidden"].includes(cs.overflow) ||
        ["auto", "scroll", "hidden"].includes(cs.overflowY)) {
      const origScrollTop = el.scrollTop;
      const orig = { overflow: el.style.overflow, overflowY: el.style.overflowY, height: el.style.height };
      el.style.overflow = "visible";
      el.style.overflowY = "visible";
      el.style.height = "auto";
      el.scrollTop = 0;
      restores.push(() => {
        el.style.overflow = orig.overflow;
        el.style.overflowY = orig.overflowY;
        el.style.height = orig.height;
        el.scrollTop = origScrollTop;
      });
    }

    el = el.parentElement;
  }

  // Reset window scroll so element's getBoundingClientRect().top is correct
  const winScrollY = window.scrollY;
  window.scrollTo(0, 0);

  // Let the browser apply all the style changes before capturing
  await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

  let canvas;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    restores.forEach(r => r());
    window.scrollTo(0, winScrollY);
  }

  // Build PDF in A4 landscape, slicing into pages
  const pageW = 297;
  const pageH = 210;
  const imgW = canvas.width;
  const imgH = canvas.height;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageHpx = Math.round((pageH / pageW) * imgW);

  let yPx = 0;
  let first = true;
  while (yPx < imgH) {
    if (!first) pdf.addPage();
    first = false;
    const sliceH = Math.min(pageHpx, imgH - yPx);
    const slice = document.createElement("canvas");
    slice.width = imgW;
    slice.height = sliceH;
    slice.getContext("2d").drawImage(canvas, 0, yPx, imgW, sliceH, 0, 0, imgW, sliceH);
    pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, (sliceH / imgW) * pageW);
    yPx += pageHpx;
  }

  pdf.save(filename);
}
