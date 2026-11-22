import QRCode from "qrcode";

export function paymentQrDataUrl(spd: string): Promise<string> {
  return QRCode.toDataURL(spd, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 512,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
