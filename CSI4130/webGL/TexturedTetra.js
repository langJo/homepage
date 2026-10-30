// ==========================================================================
// $Id: TexturedTetra.js,v 1.2 2015/02/23 20:48:36 jlang Exp $
// Texturing of a tetrahedron example based on OpenGL Programming guide
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
// $Log: TexturedTetra.js,v $
// Revision 1.2  2015/02/23 20:48:36  jlang
// Added mesh viewer
//
// Revision 1.1  2015/02/01 06:24:05  jlang
// Created texture example
//
// ==========================================================================
// Based on (c) 2012 matsuda
// HelloTriangle.js 
// Loadshaderfromfiles.js 
// RotateTriangles_withButtons.js
// LookAtTrianglesWithKeys.js
// TexturedQuad.js
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
  readShaderFile(gl, canvas, 'shader/texture.vs', 'v');
  readShaderFile(gl, canvas, 'shader/texture.fs', 'f');
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
  if (VSHADER_SOURCE && FSHADER_SOURCE) start(gl, canvas);
}


function start(gl, canvas) {

  // Initialize shaders - string now available
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

	initTextures(gl, canvas);
}


function initTextures(gl, canvas) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  // Get the storage location of u_Sampler
  var img2DSampler = gl.getUniformLocation(gl.program, 'img2DSampler');
  if (!img2DSampler) {
    console.log('Failed to get the storage location of img2DSampler');
    return false;
  }
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ loadTexture(gl, canvas, texture, img2DSampler, image); };
  // Tell the browser to load an image
  image.src = 'images/test.jpg';

  return true;
}

function loadTexture(gl, canvas, texture, img2DSampler, image) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  // gl.uniform1i(img2DSampler, 0);
  
  setScene(gl, canvas );	
}



function setScene( gl, canvas ) {
  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  gl.enable(gl.DEPTH_TEST);

  // Specify the mvp_matrix as a uniform
  // get the storage location of mvp_matrix
  var u_mvp_matrix = gl.getUniformLocation(gl.program, 'mvp_matrix');
  if (!u_mvp_matrix) { 
    console.log('Failed to get the storage location of mvp_matrix');
    return;
  }

  // Create the matrix to set the projection matrix
  var projMatrix = new Matrix4();
  projMatrix.setOrtho(-2.0, 2.0, -2.0, 2.0, -2.0, 2.0);

  // Current axis angle
  var axisAngle = 0.0;
  // Current rotation angle
  var currentAngle = 0.0;

  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ 
    keydown(ev, gl, n, currentAngle, projMatrix, u_mvp_matrix)};

  // Register the animation callback
  var tick = function() {
    var now = Date.now();
    var elapsed = now - LAST_FRAME;
    currentAngle = animate(currentAngle, SPEED, elapsed );  // Update the rotation angle
    axisAngle = animate(axisAngle, SPEED/7.0, elapsed );  // Update the axis angle
    LAST_FRAME = now;
    draw(gl, n, currentAngle, axisAngle, projMatrix, u_mvp_matrix); // Draw the triangle
    requestAnimationFrame(tick, canvas);   // Request that the browser calls tick
  };
  tick();
}


function initVertexBuffers(gl) {
  // Store vertices and texture coords interleaved
  // 0 -- 2 -- 0
  // |  / |  / |
  // | /  | /  |
  // 1 -- 3 -- 1
  var vertices = new Float32Array([
      -1.0, -1.0, 1.0, 0.0, 1.0, // 0 
    1.0, -1.0, 1.0, 0.0, 0.0, // 1 
    0.0, 1.0, 0.0, 0.5, 1.0,  // 2
    0.0, -1.0, -1.0, 0.5, 0.0,  // 3
      -1.0, -1.0, 1.0, 1.0, 1.0, // 0 
    1.0, -1.0, 1.0, 1.0, 0.0 // 1 
  ]);
  var n = 6; // The number of vertices
  var fsize = vertices.BYTES_PER_ELEMENT;
  
  // Create a VBO
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	var a_vertex = gl.getAttribLocation(gl.program, 'a_vertex'); // Get
  if (a_vertex < 0) {
    console.log('Failed to get the storage location of a_vertex');
    return -1;
  }
  // 5 entries per vertex: x y z u v 
  gl.vertexAttribPointer(a_vertex, 3, gl.FLOAT, false, 5*fsize,  fsize * 0);
  gl.enableVertexAttribArray(a_vertex);

  // Get the storage location of a_texCoord, assign buffer and enable
  var a_texCoord = gl.getAttribLocation(gl.program, 'a_texCoord');
  if(a_texCoord < 0) {
    console.log('Failed to get the storage location of a_texCoord');
    return -1;
  }
  // Texture coords start after 3 entries - the first x y z coordinate
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, fsize * 5, fsize * (3+0));
  gl.enableVertexAttribArray(a_texCoord); 

  return n;
}


function draw(gl, n, currentAngle, axisAngle, projMatrix, u_mvp_matrix) {
  // Combine model and projection matrix in js -- could also multiply in shader
  // View matrix is still identity
  var mvpMatrix = new Matrix4();
  mvpMatrix.set( projMatrix );

  // Set the rotation matrix
  mvpMatrix.rotate(axisAngle, 0, 1, 0);
  mvpMatrix.rotate(currentAngle, 1, 0, 0);


  // Pass the mvp matrix to the vertex shader
  gl.uniformMatrix4fv(u_mvp_matrix, false, mvpMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}


// Make a time based animation to keep things smooth
// Initialize global variable
function animate(angle,speed,elapsed) {
  // Calculate the elapsed time
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (speed * elapsed) / 1000.0;
  return newAngle %= 360;
}

function keydown(ev, n, gl, currentAngle, projMatrix, u_mvp_matrix) {
  switch(ev.keyCode) { 
  case 38: // up arrow key 
    SPEED += 2.0;
    break;
  case 40: // down arrow key 
    SPEED -= 2.0;
    break;
  }  
  draw(gl, n, currentAngle, projMatrix, u_mvp_matrix);
}

function setDefault() {
  SPEED = 20.0;
}

function faster() {
  SPEED += 2; 
}

function slower() {
  SPEED -= 2; 
}


