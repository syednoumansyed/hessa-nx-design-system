export function openPdfInNewTab(pdfFile: File) {
  const pdfUrl = URL.createObjectURL(pdfFile);
  window.open(pdfUrl, '_blank');
}
