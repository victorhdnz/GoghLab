declare module 'ogl' {
  export class Renderer {
    gl: WebGLRenderingContext
    canvas: HTMLCanvasElement
    constructor(options?: {
      canvas?: HTMLCanvasElement
      width?: number
      height?: number
      dpr?: number
      alpha?: boolean
      depth?: boolean
      stencil?: boolean
      antialias?: boolean
      premultipliedAlpha?: boolean
      preserveDrawingBuffer?: boolean
      powerPreference?: string
      failIfMajorPerformanceCaveat?: boolean
    })
    setSize(width: number, height: number, updateStyle?: boolean): void
    render(scene: { scene: Mesh }): void
  }

  export class Triangle {
    constructor(gl: WebGLRenderingContext)
  }

  export class Program {
    uniforms: Record<string, { value: any }>
    constructor(
      gl: WebGLRenderingContext,
      options: {
        vertex: string
        fragment: string
        uniforms?: Record<string, { value: any }>
      }
    )
  }

  export class Mesh {
    constructor(
      gl: WebGLRenderingContext,
      options: {
        geometry: Triangle
        program: Program
      }
    )
  }

  export class Vec3 {
    x: number
    y: number
    z: number
    constructor(x?: number, y?: number, z?: number)
    set(x: number, y: number, z: number): Vec3
  }
}

