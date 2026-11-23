declare module "pdfmake/build/pdfmake" {
  interface PdfMakeApi {
    addVirtualFileSystem: (vfs: Record<string, string>) => void;
    createPdf: (doc: unknown) => { getBlob: () => Promise<Blob> };
  }
  const pdfMake: PdfMakeApi;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfs: Record<string, string>;
  export default vfs;
}
