// ==========================================================================
// $Id: TriangleRaster.js,v 1.2 2015/01/19 15:48:36 jlang Exp $
// Triangle rasterization example based on OpenGL Programming guide
// by Matsuda and Lea, 2013
//
// ==========================================================================
// (C)opyright:
//
//   This code is heavily based on the WebGL Programming
//   Guide by Kouichi Matsuda and Rodger Lea and is their copyright. 
//   See https://sites.google.com/site/webglbook/
//
//   The code posted is re-used with the generours permission by the authors.
//
//   Jochen Lang
//   EECS, University of Ottawa
//   800 King Edward Ave.
//   Ottawa, On., K1N 6N5
//   Canada.
//   http://www.eecs.uottawa.ca
//
// Creator: jlang (Jochen Lang)
// Email:   jlang@eecs.uottawa.ca
// ==========================================================================
// $Log: TriangleRaster.js,v $
// Revision 1.2  2015/01/19 15:48:36  jlang
// Updated copyright note and updated html start page
//
// Revision 1.1  2015/01/08 15:31:44  jlang
// Created simple triangle rasterization example
//
// ==========================================================================

// Based on HelloTriangle.js and Loadshaderfromfiles.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;


function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
    // Read shader from file
  readShaderFile(gl, 'shader/triangle.vs', 'v');
  readShaderFile(gl, 'shader/triangle.fs', 'f');
}


// Read shader from file
function readShaderFile(gl, fileName, shader) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) { 
	onReadShader(gl, request.responseText, shader); 
    }
  }
  // Create a request to acquire the file
  request.open('GET', fileName, true); 
  request.send();                      // Send the request
}


// The shader is loaded from file
function onReadShader(gl, fileString, shader) {
  if (shader == 'v') { // Vertex shader
    VSHADER_SOURCE = fileString;
  } else 
  if (shader == 'f') { // Fragment shader
    FSHADER_SOURCE = fileString;
  }
  // When both are available, call start().
  if (VSHADER_SOURCE && FSHADER_SOURCE) start(gl);
}


function start(gl) {

  // Initialize shaders - string now available
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the mvp_matrix as a uniform
  // get the storage location of mvp_matrix
  var u_mvp_matrix = gl.getUniformLocation(gl.program, 'mvp_matrix');
  if (!u_mvp_matrix) { 
    console.log('Failed to get the storage location of mvp_matrix');
    return;
  }

  // Create the matrix to set the eye point, and the line of sight
  var projMatrix = new Matrix4();
  projMatrix.setOrtho(-3.0, 3.0, -2.0, 4.0, -1.0, 1.0);

  // Pass the projection matrix to u_mvp_matrix
  gl.uniformMatrix4fv(u_mvp_matrix, false, projMatrix.elements);

  // Specify the color for clearing <canvas> to black
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas> color 
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the triangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
}


function initVertexBuffers(gl) {
  // Store vertices and colors interleaved 
  var vertices = new Float32Array([
      -2.4, -1.7, 1.0, 0.0, 0.0, 
    2.7, 1.3, 0.0, 1.0, 0.0,  
      -0.6, 3.4, 0.0, 0.0, 1.0 
  ]);
  var n = 3; // The number of vertices
  var fsize = vertices.BYTES_PER_ELEMENT;


  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_vertex = gl.getAttribLocation(gl.program, 'a_vertex');
  if (a_vertex < 0) {
    console.log('Failed to get the storage location of a_vertex');
    return -1;
  }
  // Assign the buffer object to a_vertex variable
  // 5 entries per vertex: x y r g b
  gl.vertexAttribPointer(a_vertex, 2, gl.FLOAT, false, 5*fsize, 0);

  // Enable the assignment to a_vertex variable
  gl.enableVertexAttribArray(a_vertex);

  // Get the storage location of a_color, assign buffer and enable
  var a_color = gl.getAttribLocation(gl.program, 'a_color');
  if(a_color < 0) {
    console.log('Failed to get the storage location of a_color');
    return -1;
  }
  // Colors start after 2 entries - the first x y coordinate
  gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 5*fsize, 2*fsize);
  gl.enableVertexAttribArray(a_color); 

  return n;
}
