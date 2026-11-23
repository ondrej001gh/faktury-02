export function readLogoFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Vyberte obrázek."));
  if (file.size > 5_000_000) return Promise.reject(new Error("Logo je větší než 5 MB."));
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const maxSide = 480;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Obrázek se nepodařilo zpracovat."));
        return;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let dataUrl = canvas.toDataURL("image/png");
      if (dataUrl.length > 350_000) dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Obrázek se nepodařilo načíst."));
    };
    image.src = url;
  });
}
