declare module "qrcode" {
  interface QRCodeOptions {
    type?: "png" | "svg" | "utf8";
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    scale?: number;
  }

  function toBuffer(text: string, options?: QRCodeOptions): Promise<Buffer>;
  function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  function toString(text: string, options?: QRCodeOptions): Promise<string>;

  export default { toBuffer, toDataURL, toString };
  export { toBuffer, toDataURL, toString };
}
