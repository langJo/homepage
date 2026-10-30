// ==========================================================================
// $Id: OBJViewer.js,v 1.11 2015/03/18 21:04:11 jlang Exp $
// Simple wavefront obj loader based on OpenGL Programming guide
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
// $Log: OBJViewer.js,v $
// Revision 1.11  2015/03/18 21:04:11  jlang
// Use ev.keycode instead of ev.key to be compatible with Chrome
//
// Revision 1.10  2015/03/10 00:03:07  jlang
// Gray background
//
// Revision 1.9  2015/03/09 23:43:38  jlang
// Check-in for A3
//
// Revision 1.8  2015/03/09 23:08:17  jlang
// Update to material and blinn-phong with diffuse cut-off.
//
// Revision 1.7  2015/03/09 19:14:38  jlang
// Added zoom feature.
//
// Revision 1.6  2015/03/09 18:35:09  jlang
// Updated structure definitions to work on Windows.
//
// Revision 1.5  2015/03/09 04:10:48  jlang
// Blinn-Phong, Cook-Torrance lighting, version 1
//
// Revision 1.4  2015/03/08 05:52:44  jlang
// Coded OBJViewer user interface, created OBJDraw and OBJLoader files
//
// Revision 1.3  2015/03/07 20:47:29  jlang
// Changes to OBJViewer.js
//
// Revision 1.2  2015/02/23 20:48:36  jlang
// Added mesh viewer
//
// ==========================================================================
// Based on (c) 2012 matsuda
// OBJViewer.js

// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;

// Lets make gl and cnavas global
var gl = null;
var canvas = null;

// Draw handle
var DRAW_OBJECT = null;

// Animation request
var REQUEST_ID = 0;
var LAST_UPDATE = Date.now(); // Last time animation was updated

var SPEED = 0;   // The increments of rotation angle (degrees)
var VIEW_ANGLE = 0;

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Read shader from file
  readShaderFile('shader/lighting.vs', 'v');
  // readShaderFile('shader/blinn_phong.fs', 'f');
  // readShaderFile('shader/cook_torrance.fs', 'f');
  readShaderFile(FRAGMENT_SHADER, 'f');
}


// Read shader from file
function readShaderFile(fileName, shader) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) { 
				onReadShader(request.responseText, shader); 
    }
  }
  // Create a request to acquire the file
  request.open('GET', fileName, true); 
  request.send();                      // Send the request
}


// The shader is loaded from file
function onReadShader(fileString, shader) {
  if (shader == 'v') { // Vertex shader
    VSHADER_SOURCE = fileString;
  } else 
  if (shader == 'f') { // Fragment shader
    FSHADER_SOURCE = fileString;
  }
  // When both are available, call start().
  if (VSHADER_SOURCE && FSHADER_SOURCE) start();
}

function start() {

  // Initialize shaders - string now available
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  setDefault();		

  // Set the clear color and enable the depth test
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of attribute and uniform variables
  var program = gl.program;
  program.a_Position = gl.getAttribLocation(program, 'a_vertex');
  program.a_Normal = gl.getAttribLocation(program, 'a_normal');
  program.a_Color = gl.getAttribLocation(program, 'a_color');
  program.u_MvMatrix = gl.getUniformLocation(program, 'mv_matrix');
  program.u_PMatrix = gl.getUniformLocation(program, 'p_matrix');
  program.u_NormalMatrix = gl.getUniformLocation(program, 'normal_matrix');
  program.u_lightDir = gl.getUniformLocation(program, 'lightDir');

  // Light parameters
  program.u_lightSource_ambient = gl.getUniformLocation(program, 'light_source.ambient');
  program.u_lightSource_diffuse = gl.getUniformLocation(program, 'light_source.diffuse');
  program.u_lightSource_specular = gl.getUniformLocation(program, 'light_source.specular');

  // Material parameters
  program.u_Material_ambient = gl.getUniformLocation(program, 'material.ambient');
  program.u_Material_diffuse = gl.getUniformLocation(program, 'material.diffuse');
  program.u_Material_specular = gl.getUniformLocation(program, 'material.specular');
  program.u_Material_shininess = gl.getUniformLocation(program, 'material.shininess');

  if (program.a_Position < 0 ||  program.a_Normal < 0 || program.a_Color < 0 ||
      !program.u_MvMatrix || !program.u_PMatrix || !program.u_NormalMatrix ||
      !program.u_lightDir || 
      !program.u_lightSource_ambient || !program.u_lightSource_diffuse ||
      !program.u_lightSource_specular ) {
    console.log('attribute, uniform'); 
    // return;
  }

  // Write the light_Source
  //gl.uniform4f(program.u_lightSource_ambient, 0.0, 0.0, 0.0, 1.0);
  gl.uniform4f(program.u_lightSource_ambient, 1.0, 1.0, 1.0, 1.0);
  gl.uniform4f(program.u_lightSource_diffuse, 1.0, 1.0, 1.0, 1.0);
  gl.uniform4f(program.u_lightSource_specular, 1.0, 1.0, 1.0, 1.0);

  // Set the material
  if (program.u_Material_ambient)
    gl.uniform4f(program.u_Material_ambient, 0.19, 0.07, 0.02, 1.0);
    // gl.uniform4f(program.u_Material_specular, 0.0, 0.0, 0.0, 1.0);   
  if (program.u_Material_diffuse)
    gl.uniform4f(program.u_Material_diffuse, 0.7, 0.27, 0.08, 1.0); 
    // gl.uniform4f(program.u_Material_diffuse, 0.0, 0.0, 0.0, 1.0); 
  if (program.u_Material_specular)  
    gl.uniform4f(program.u_Material_specular, 0.26, 0.14, 0.09, 1.0);
    // gl.uniform4f(program.u_Material_specular, 0.7, 0.27, 0.08, 1.0); 
    // gl.uniform4f(program.u_Material_specular, 0.0, 0.0, 0.0, 1.0);  
  if (program.u_Material_shininess)
    gl.uniform1i(program.u_Material_shininess, 13 );

  // Prepare empty buffer objects for vertex coordinates, colors, and normals
  var model = initVertexBuffers(program);
  if (!model) {
    console.log('Failed to set the vertex information');
    return;
  }

  // 
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(VIEW_ANGLE, canvas.width/canvas.height, 1.0, 10.0);
  // projMatrix.setOrtho(-1.5, 1.5,-1.5, 1.5, 1.0, 10.0);
  
  var viewMatrix = new Matrix4();
  viewMatrix.lookAt(0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  // Start reading the OBJ file
  // readOBJFile('mesh/sphere.obj', gl, 1.0, true);
  readOBJFile(OBJ_FILENAME, gl, 1.0, true);

  var currentAngle = 0.0; // Current rotation angle [degree]
  DRAW_OBJECT = new OBJDraw(gl.program, currentAngle, projMatrix, viewMatrix, model);

  document.onkeydown = function(ev){ keydown(ev) };

  startAnimate(); // start animation and enter loop
}


function tick() {
	// Update current rotation angle
  DRAW_OBJECT.currentAngle = animate(DRAW_OBJECT.currentAngle); 
  DRAW_OBJECT.draw();
  REQUEST_ID = requestAnimationFrame(tick, canvas);
}

function startAnimate() {
	if (!REQUEST_ID) {
		LAST_UPDATE = Date.now();
		tick();
	}
}

function stopAnimate() {
	if (REQUEST_ID) {
		cancelAnimationFrame(REQUEST_ID);
		REQUEST_ID = 0;
  }
}


// Create an buffer object and perform an initial configuration
function initVertexBuffers(program) {
  var o = new Object(); // Utilize Object object to return multiple buffer objects
  o.vertexBuffer = createEmptyArrayBuffer(program.a_Position, 3, gl.FLOAT); 
  o.normalBuffer = createEmptyArrayBuffer(program.a_Normal, 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(program.a_Color, 4, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();
  if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(a_attribute, num, type) {
  var buffer =  gl.createBuffer();  // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

  return buffer;
}

// OBJ File has been read compreatly
function onReadComplete(model, objDoc) {
  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo();

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
  
  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

  return drawingInfo;
}

function animate(angle) {
  var now = Date.now();   // Calculate the elapsed time
  var elapsed = now - LAST_UPDATE;
  LAST_UPDATE = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (SPEED * elapsed) / 1000.0;
  return newAngle % 360;
}


//---------------------------------------------------------
// User Interaction
//---------------------------------------------------------

function handleAnimationChange(cb) {
	if (cb.checked) startAnimate();
	else stopAnimate();
}

function switchObjectLightControl(olc) {
	DRAW_OBJECT.setObjLight(olc.checked);
}

function keydown(ev) {
  if ( !DRAW_OBJECT ) return;
  switch(ev.keyCode) { // keycode seems to also work on Chrome
  case 65: // left  
    DRAW_OBJECT.setAngleY(-1.0);
    break;
  case 87: // up
    DRAW_OBJECT.setAngleX(-1.0);
    break;
  case 83: // down
    DRAW_OBJECT.setAngleX(1.0);
    break;
  case 68: // right
    DRAW_OBJECT.setAngleY(1.0);
    break;
  case 107: // plus
    zoom( 1.0/1.1 );
    break;
  case 109: // minus
    zoom( 1.1 );
    break;
  } 
  DRAW_OBJECT.draw();
}

function setDefault() {
  SPEED = 30.0;
  VIEW_ANGLE = 25.0;
  var projMatrix = new Matrix4();
  if ( DRAW_OBJECT ) {
    projMatrix.setPerspective(VIEW_ANGLE, canvas.width/canvas.height, 1.0, 10.0);
    DRAW_OBJECT.setProjMatrix(projMatrix);
    DRAW_OBJECT.draw();
  }
}

function faster() {
  SPEED *= 1.41; 
}

function slower() {
  SPEED /= 1.41; 
}

function zoom( factor ) {
  VIEW_ANGLE *= factor;
  if ( VIEW_ANGLE <= 1.0 ) VIEW_ANGLE = 1.0;
  if ( VIEW_ANGLE >= 150.0 ) VIEW_ANGLE = 150.0;
  var projMatrix = new Matrix4();
  if (DRAW_OBJECT) {
    projMatrix.setPerspective(VIEW_ANGLE, canvas.width/canvas.height, 1.0, 10.0);
    DRAW_OBJECT.setProjMatrix(projMatrix);
    DRAW_OBJECT.draw();
  }
}
