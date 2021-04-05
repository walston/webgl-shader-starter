import { glMatrix, mat4 } from 'gl-matrix'

import { createShader } from './utils'
import vertexShaderProgram from './vertexShader.glsl'
import fragmentShaderProgram from './fragmentShader.glsl'

function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const gl = canvas?.getContext('webgl')

  if (!gl) {
    throw new Error('The execution environment does not support WebGL.')
  }

  gl.clearColor(0.75, 0.85, 0.8, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.COLOR_BUFFER_BIT)

  // Compile shaders.
  const vertexShader = createShader(gl, vertexShaderProgram, gl.VERTEX_SHADER)
  const fragmentShader = createShader(gl, fragmentShaderProgram, gl.FRAGMENT_SHADER)

  // Create program.
  const program = gl.createProgram()

  if (!program) {
    throw new Error('Failed to create GL program.')
  }

  // Attach shaders.
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)

  // Delete the shader (Should be done in C but otherwise GC will clean this up).
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  // Link shaders to program.
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Could not link GL program.\n' + gl.getProgramInfoLog(program))
  }

  // Validate the program.
  gl.validateProgram(program)
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    throw new Error('Invalid GL program.\n' + gl.getProgramInfoLog(program))
  }

  // Use the program.
  gl.useProgram(program)

  // Create vec3 position buffer (counter-clockwise).
  // prettier-ignore
  const boxVertices = [
    // X, Y, Z           R, G, B
    // Top
    -1.0, 1.0, -1.0,   0.5, 0.5, 0.5,
    -1.0, 1.0, 1.0,    0.5, 0.5, 0.5,
    1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
    1.0, 1.0, -1.0,    0.5, 0.5, 0.5,

    // Left
    -1.0, 1.0, 1.0,    0.75, 0.25, 0.5,
    -1.0, -1.0, 1.0,   0.75, 0.25, 0.5,
    -1.0, -1.0, -1.0,  0.75, 0.25, 0.5,
    -1.0, 1.0, -1.0,   0.75, 0.25, 0.5,

    // Right
    1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
    1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
    1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
    1.0, 1.0, -1.0,   0.25, 0.25, 0.75,

    // Front
    1.0, 1.0, 1.0,    1.0, 0.0, 0.15,
    1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
    -1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
    -1.0, 1.0, 1.0,    1.0, 0.0, 0.15,

    // Back
    1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
    1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
    -1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
    -1.0, 1.0, -1.0,    0.0, 1.0, 0.15,

    // Bottom
    -1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
    -1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
    1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
    1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
	];

  // Which sets of vertices form a triangle (as we are sharing vertices for multiple
  // triangles for efficiency).
  // prettier-ignore
  const boxIndices = [
    // Top
    0, 1, 2,
    0, 2, 3,

    // Left
    5, 4, 6,
    6, 4, 7,

    // Right
    8, 9, 10,
    8, 10, 11,

    // Front
    13, 12, 14,
    15, 14, 12,

    // Back
    16, 17, 18,
    16, 18, 19,

    // Bottom
    21, 20, 22,
    22, 20, 23
	];

  // Create a vertex buffer to hold the triangle coords.
  const boxVertexBufferObject = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW)

  const boxIndexBufferObject = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW)

  // Get the attribute index position in the shader by name in vertexShader.glsl.
  const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition')
  const colorAttribLocation = gl.getAttribLocation(program, 'vertColor')

  // Find the current buffer to the vertex  attribute in the vertex shader.
  gl.vertexAttribPointer(
    positionAttribLocation,
    3, // Number of elements per attribute (vec3).
    gl.FLOAT, // Type of elements.
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    0 // Offset in single vertex to the value.
  )
  gl.enableVertexAttribArray(positionAttribLocation)

  gl.vertexAttribPointer(
    colorAttribLocation,
    3, // Number of elements per attribute (vec3).
    gl.FLOAT, // Type of elements.
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    3 * Float32Array.BYTES_PER_ELEMENT // Offset in single vertex to the value.
  )
  gl.enableVertexAttribArray(colorAttribLocation)

  // Setup world, view, proj matrices for a 3D world.
  const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld')
  const matViewUniformLocation = gl.getUniformLocation(program, 'mView')
  const matProjUniformLocation = gl.getUniformLocation(program, 'mProj')

  const worldMatrix = new Float32Array(16)
  const viewMatrix = new Float32Array(16)
  const projMatrix = new Float32Array(16)

  mat4.identity(worldMatrix)
  mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0])
  mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0)

  gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix)
  gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix)
  gl.uniformMatrix4fv(matProjUniformLocation, false, projMatrix)

  const xRotationMatrix = new Float32Array(16)
  const yRotationMatrix = new Float32Array(16)

  const identityMatrix = new Float32Array(16)
  mat4.identity(identityMatrix)

  // Main render loop.
  let angle: number
  const gameLoop = function gameLoop() {
    angle = (performance.now() / 1000 / 6) * 2 * Math.PI // 1 rot. every 6 secs
    mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0])
    mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0])
    mat4.multiply(worldMatrix, xRotationMatrix, yRotationMatrix)
    gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix)

    // Clear screen.
    gl.clearColor(0.75, 0.85, 0.8, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.COLOR_BUFFER_BIT)

    // Enable backface culling.
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.frontFace(gl.CCW) // Counter-clockwise coords.
    gl.cullFace(gl.BACK)

    gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0)

    requestAnimationFrame(gameLoop)
  }
  requestAnimationFrame(gameLoop)
}

main()

export {}
