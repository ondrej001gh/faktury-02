import type { Invoice } from "../types";
import { buildInvoiceDocument } from "./invoiceDocument";
import { buildInvoiceView } from "./invoiceView";
import { paymentQrDataUrl } from "./qr";

interface PdfMakeApi {
  addVirtualFileSystem: (vfs: Record<string, string>) => void;
  createPdf: (doc: unknown) => { getBlob: () => Promise<Blob> };
}

let pdfMakePromise: Promise<PdfMakeApi> | null = null;

async function loadPdfMake(): Promise<PdfMakeApi> {
  if (!pdfMakePromise) {
    pdfMakePromise = (async () => {
      const pdfModule = (await import("pdfmake/build/pdfmake")) as { default?: PdfMakeApi } & PdfMakeApi;
      const vfsModule = (await import("pdfmake/build/vfs_fonts")) as { default?: Record<string, string> } & Record<string, string>;
      const pdfMake = pdfModule.default ?? pdfModule;
      const vfs = vfsModule.default ?? vfsModule;
      pdfMake.addVirtualFileSystem(vfs);
      return pdfMake;
    })().catch((error: unknown) => {
      pdfMakePromise = null;
      throw error;
    });
  }
  return pdfMakePromise;
}

function fileName(number: string): string {
  const safe = number.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "");
  return `faktura-${safe || "doklad"}.pdf`;
}

export async function downloadInvoicePdf(invoice: Invoice, logoDataUrl = ""): Promise<void> {
  const view = buildInvoiceView(invoice);
  const qrDataUrl = view.spd ? await paymentQrDataUrl(view.spd) : undefined;
  const doc = buildInvoiceDocument(invoice, { qrDataUrl, logoDataUrl });
  const pdfMake = await loadPdfMake();
  const blob = await pdfMake.createPdf(doc).getBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(invoice.number);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
