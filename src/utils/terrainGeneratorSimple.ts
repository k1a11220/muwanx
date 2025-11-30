import { createNoise2D } from 'simplex-noise'

/**
 * Generate terrain using small boxes (more practical for web)
 * Better performance than heightfield for WASM
 */
export function generateBoxTerrain(options: {
  sizeX?: number
  sizeY?: number
  resolution?: number
  scale?: number
  octaves?: number
  amplitude?: number
  centerX?: number
  centerY?: number
} = {}): string {
  const {
    sizeX = 15,
    sizeY = 15,
    resolution = 0.4,
    scale = 0.15,
    octaves = 3,
    amplitude = 0.15,
    centerX = 0,
    centerY = 0
  } = options

  const noise2D = createNoise2D()
  let xml = ''

  const startX = centerX - sizeX / 2
  const startY = centerY - sizeY / 2
  const endX = centerX + sizeX / 2
  const endY = centerY + sizeY / 2

  for (let x = startX; x < endX; x += resolution) {
    for (let y = startY; y < endY; y += resolution) {
      let height = 0

      // Multiple octaves for natural look
      for (let o = 0; o < octaves; o++) {
        const freq = Math.pow(2, o)
        const amp = amplitude * Math.pow(0.5, o)
        const nx = x * scale * freq
        const ny = y * scale * freq
        height += noise2D(nx, ny) * amp
      }

      // Ensure positive height
      height = Math.abs(height) + 0.02

      // Color based on height
      const color = getColorForHeight(height)

      xml += `    <geom type="box" pos="${x.toFixed(3)} ${y.toFixed(3)} ${(height / 2).toFixed(3)}" size="${(resolution / 2).toFixed(3)} ${(resolution / 2).toFixed(3)} ${(height / 2).toFixed(3)}" rgba="${color}" friction="0.8 0.1 0.1"/>\n`
    }
  }

  return xml
}

function getColorForHeight(height: number): string {
  if (height < 0.05) {
    return '0.35 0.35 0.4 1'   // Low: darker
  } else if (height < 0.1) {
    return '0.4 0.4 0.45 1'    // Medium
  } else {
    return '0.45 0.45 0.5 1'   // High: lighter
  }
}

/**
 * Terrain presets
 */
export const TerrainPresets = {
  flat: {
    amplitude: 0.02,
    scale: 0.1,
    octaves: 1
  },
  gentle: {
    amplitude: 0.1,
    scale: 0.12,
    octaves: 2
  },
  rolling: {
    amplitude: 0.15,
    scale: 0.15,
    octaves: 3
  },
  rough: {
    amplitude: 0.25,
    scale: 0.2,
    octaves: 4
  }
}
