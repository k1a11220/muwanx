import { createNoise2D } from 'simplex-noise'

export interface TerrainOptions {
  size?: number        // Grid size (256, 512, etc)
  scale?: number       // Noise scale (smaller = more detail)
  octaves?: number     // Number of noise layers
  persistence?: number // How much each octave contributes
  amplitude?: number   // Height multiplier
}

/**
 * Generate a heightmap PNG from Perlin noise
 * Returns a data URL that can be used in MuJoCo
 */
export function generateHeightmapPNG(options: TerrainOptions = {}): string {
  const {
    size = 256,
    scale = 0.05,
    octaves = 4,
    persistence = 0.5,
    amplitude = 1.0
  } = options

  const noise2D = createNoise2D()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  const imageData = ctx.createImageData(size, size)

  // Generate noise
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let height = 0
      let maxValue = 0
      let amp = amplitude

      // Multiple octaves for natural terrain
      for (let o = 0; o < octaves; o++) {
        const freq = Math.pow(2, o)
        const nx = x * scale * freq
        const ny = y * scale * freq

        height += noise2D(nx, ny) * amp
        maxValue += amp
        amp *= persistence
      }

      // Normalize to 0-1
      height = (height / maxValue + 1) / 2

      // Convert to grayscale (0-255)
      const value = Math.floor(height * 255)

      const idx = (y * size + x) * 4
      imageData.data[idx] = value     // R
      imageData.data[idx + 1] = value // G
      imageData.data[idx + 2] = value // B
      imageData.data[idx + 3] = 255   // A
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Generate MJCF XML for heightfield terrain
 */
export function generateTerrainMJCF(hfieldName: string, pngDataUrl: string, options: {
  width?: number,  // World size in meters
  height?: number,
  maxHeight?: number
} = {}): string {
  const {
    width = 20,
    height = 20,
    maxHeight = 1.0
  } = options

  return `
    <asset>
      <hfield name="${hfieldName}"
              nrow="256" ncol="256"
              size="${width} ${height} ${maxHeight} 0.1"
              file="${pngDataUrl}"/>
    </asset>

    <worldbody>
      <geom name="${hfieldName}_geom"
            type="hfield"
            hfield="${hfieldName}"
            rgba="0.4 0.4 0.45 1"
            friction="0.8 0.1 0.1"/>
    </worldbody>
  `
}

/**
 * Preset terrain types
 */
export const TerrainPresets = {
  smooth: {
    scale: 0.03,
    octaves: 2,
    persistence: 0.5,
    amplitude: 0.5
  },
  rolling: {
    scale: 0.05,
    octaves: 3,
    persistence: 0.6,
    amplitude: 1.0
  },
  rough: {
    scale: 0.08,
    octaves: 4,
    persistence: 0.7,
    amplitude: 1.5
  },
  mountains: {
    scale: 0.04,
    octaves: 6,
    persistence: 0.5,
    amplitude: 2.0
  }
}
