import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

@Injectable({
  providedIn: 'root',
})
export class PdfPrintService {
  constructor() {}

  // Merge multiple PDFs into a single PDF Blob URL
  async mergePdfs(pdfUrls: string[]): Promise<string> {
    const mergedPdf = await PDFDocument.create();

    for (const url of pdfUrls) {
      const pdfBytes = await fetch(url).then((res) => res.arrayBuffer());
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const savedPdf = await mergedPdf.save();
    const pdfBlob = new Blob([new Uint8Array(savedPdf)], {
      type: 'application/pdf',
    });
    return URL.createObjectURL(pdfBlob);
  }
  // Trigger the browser print dialog for a given PDF Blob URL
  printPdf(pdfBlobUrl: string): void {
    const printWindow = window.open(pdfBlobUrl, '_blank');
    printWindow?.addEventListener('load', () => {
      printWindow.print();
    });
  }

  // High-level method that combines merging and printing
  async mergeAndPrintPdfs(pdfUrls: string[]): Promise<void> {
    const pdfBlobUrl = await this.mergePdfs(pdfUrls);
    this.printPdf(pdfBlobUrl);
  }

  viewPdf(pdfBlobUrl: string): void {
    window.open(pdfBlobUrl, '_blank');
  }
}
