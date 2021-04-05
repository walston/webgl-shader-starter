export function createShader(gl: WebGLRenderingContext, program: string, type: number) {
  const shader = gl.createShader(type)

  if (!shader) {
    throw new Error('Failed to create GL Shader.')
  }

  gl.shaderSource(shader, program)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error('Shader failed to compile:\n' + gl.getShaderInfoLog(shader))
  }

  return shader
}
