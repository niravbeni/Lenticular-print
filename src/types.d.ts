declare module 'changedpi' {
  export function changeDpiBlob(blob: Blob, dpi: number): Promise<Blob>;
  export function changeDpiDataUrl(dataUrl: string, dpi: number): string;
}

declare module 'utif' {
  interface IFD {
    [key: string]: unknown;
  }
  export function encodeImage(
    rgba: ArrayBuffer | Uint8Array,
    w: number,
    h: number,
    metadata?: Record<string, number[]>
  ): ArrayBuffer;
  export function encode(ifds: IFD[]): ArrayBuffer;
  export function decode(buffer: ArrayBuffer): IFD[];
  export function decodeImage(buffer: ArrayBuffer, ifd: IFD): void;
  export function toRGBA8(ifd: IFD): Uint8Array;
}
