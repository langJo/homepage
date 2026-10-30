// ==========================================================================
// $Id: RotateTranslate.js,v 1.2 2015/01/19 15:48:36 jlang Exp $
// 2D Translation and rotation example based on OpenGL Programming guide
// by Matsuda and Lea, 2013
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
// $Log: RotateTranslate.js,v $
// Revision 1.2  2015/01/19 15:48:36  jlang
// Updated copyright note and updated html start page
//
// Revision 1.1  2015/01/14 01:01:33  jlang
// Created RotateTranslate example
//
// ==========================================================================
// Based on (c) 2012 matsuda
// HelloTriangle.js 
// Loadshaderfromfiles.js 
// RotateTriangles_withButtons.js
// LookAtTrianglesWithKeys.js
// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;

// Toggle switching the order of transformations
var ROT_TRANS = true; 

// Rotation speed (degrees/second)
var SPEED;
// x/y translation
var OFFSET_X, OFFSET_Y; 

// Initialize time of last rotation update
var LAST_FRAME = Date.now();


function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  setDefault(); // set global variables to default

  // Read shader from file
  readShaderFile(gl, canvas, 'shader/triangle.vs', 'v');
  readShaderFile(gl, canvas, 'shader/triangle.fs', 'f');
}


// Read shader from file
function readShaderFile(gl, canvas, fileName, shader) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) { 
	onReadShader(gl, canvas, request.responseText, shader); 
    }
  }
  // Create a request to acquire the file
  request.open('GET', fileName, true); 
  request.send();                      // Send the request
}


// The shader is loaded from file
function onReadShader(gl, canvas, fileString, shader) {
  if (shader == 'v') { // Vertex shader
    VSHADER_SOURCE = fileString;
  } else 
  if (shader == 'f') { // Fragment shader
    FSHADER_SOURCE = fileString;
  }
  // When both are available, call start().
  if (VSHADER_SOURCE && FSHADER_SOURCE) start(gl,canvas);
}


function start(gl, canvas) {

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

  // Create the matrix to set the projection matrix
  var projMatrix = new Matrix4();
  projMatrix.setOrtho(-5.0, 5.0, -5.0, 5.0, -1.0, 1.0);

  // Current rotation angle
  var currentAngle = 0.0;

  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ 
    keydown(ev, gl, n, currentAngle, projMatrix, u_mvp_matrix)};

  // Register the animation callback
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, projMatrix, u_mvp_matrix); // Draw the triangle
    requestAnimationFrame(tick, canvas);   // Request that the browser calls tick
  };
  tick();
}


function initVertexBuffers(gl) {
  // Store vertices and colors interleaved 
  var vertices = new Float32Array([
      -1.0, 0, 1.0, 0.0, 0.0, 
      1.0, 0, 0.0, 1.0, 0.0,  
      0, 1.0, 0.0, 0.0, 1.0 
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

function draw(gl, n, currentAngle, projMatrix, u_mvp_matrix) {
  // Combine model and projection matrix in js -- could also multiply in shader
  // View matrix is still identity
  var mvpMatrix = new Matrix4();
  mvpMatrix.set( projMatrix );

  // Set the rotation matrix
  if (ROT_TRANS) {
    mvpMatrix.rotate(currentAngle, 0, 0, 1);
    mvpMatrix.translate(OFFSET_X, OFFSET_Y, 0);    
  } else {
    mvpMatrix.translate(OFFSET_X, OFFSET_Y, 0);
    mvpMatrix.rotate(currentAngle, 0, 0, 1);
  }

  // Pass the mvp matrix to the vertex shader
  gl.uniformMatrix4fv(u_mvp_matrix, false, mvpMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

// Make a time based animation to keep things smooth
// Initialize global variable
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - LAST_FRAME;
  LAST_FRAME = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (SPEED * elapsed) / 1000.0;
  return newAngle %= 360;
}


function keydown(ev, n, gl, currentAngle, projMatrix, u_mvp_matrix) {
  switch(ev.keyCode) { 
  case 37: // left arrow key 
    OFFSET_X -= 0.1;
    break;
  case 38: // left arrow key 
    OFFSET_Y += 0.1;
    break;
  case 39: // right arrow key 
    OFFSET_X += 0.1;
    break;
  case 40: // left arrow key 
    OFFSET_Y -= 0.1;
    break;
  }  
  draw(gl, n, currentAngle, projMatrix, u_mvp_matrix);
}

function setDefault() {
  SPEED = 20.0;
  OFFSET_X = 0.0;
  OFFSET_Y = 0.0; 
}

function faster() {
  SPEED += 1; 
}

function slower() {
  SPEED -= 1; 
}


function RotTrans() {
  ROT_TRANS = true; 
}

function TransRot() {
  ROT_TRANS = false; 
}
