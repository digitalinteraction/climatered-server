declare module 'waveheader' {
  export interface WaveheaderOptions {
    channels?: number
    sampleRate?: number
    bitDepth?: number
  }

  declare function waveheader(
    length: number,
    options?: WaveheaderOptions
  ): Buffer

  export = waveheader
}
