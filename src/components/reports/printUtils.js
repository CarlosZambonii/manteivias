export async function generatePDF(element, filename = "relatorio.pdf") {
  // Collect all stylesheets from the page (includes Tailwind + app CSS)
  const styleTexts = [];
  for (const sheet of document.styleSheets) {
    try {
      styleTexts.push(
        Array.from(sheet.cssRules).map(r => r.cssText).join("\n")
      );
    } catch (_) {
      // Cross-origin sheet — import by URL
      if (sheet.href) styleTexts.push(`@import url("${sheet.href}");`);
    }
  }

  const title = filename.replace(/\.pdf$/i, "");

  const printWin = window.open(
    "",
    "_blank",
    "width=1200,height=900,menubar=no,toolbar=no,location=no,status=no"
  );

  if (!printWin) {
    alert(
      "O browser bloqueou o popup.\nAtiva popups para este site e tenta novamente."
    );
    return;
  }

  printWin.document.open();
  printWin.document.write(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <base href="${window.location.origin}/">
  <style>
    ${styleTexts.join("\n")}
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
    }
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
  </style>
</head>
<body>${element.outerHTML}</body>
</html>`);
  printWin.document.close();

  // Wait for images and fonts to load, then print
  await new Promise(res => {
    const ready = () => {
      setTimeout(() => {
        printWin.focus();
        printWin.print();
        // Give the print dialog time to appear before closing the window
        setTimeout(() => {
          try { printWin.close(); } catch (_) {}
          res();
        }, 1000);
      }, 600);
    };

    if (printWin.document.readyState === "complete") {
      ready();
    } else {
      printWin.addEventListener("load", ready, { once: true });
      // Fallback in case load event doesn't fire
      setTimeout(ready, 2000);
    }
  });
}
