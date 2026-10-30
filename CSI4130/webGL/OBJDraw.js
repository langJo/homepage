
// Requires a global gl variable

// OBJDraw object
// Constructor
var OBJDraw = function(program, currentAngle, projMatrix, viewMatrix, model) {
  this.program = program;  // The current program
  this.viewMatrix = viewMatrix;  // Current view matrix
  this.model = model;   // Object containing the array buffers
  // Object orientation
  this.currentAngle = currentAngle;   // Current animation angle
  this.obj_angleX = 0.0;
  this.obj_angleY = 0.0;
  this.light_angleX = 0.0;
  this.light_angleY = 0.0;
  this.updateObj = false;
  this.trackball = new Matrix4();
  // Coordinate transformation matrix
  this.modelMatrix = new Matrix4();
  this.mvMatrix = new Matrix4();
  this.projMatrix = projMatrix;
  this.normalMatrix = new Matrix4();

  // Drawing info about the model
  this.ptLight = false;
  this.drawingInfo = null;
}


OBJDraw.prototype.setAngleX = function( dAX ) {
  if (this.updateObj) {
    this.obj_angleX += dAX;
  } else {
    this.light_angleX += dAX;
  }
}

OBJDraw.prototype.setAngleY = function( dAY ) {
  if (this.updateObj) {
    this.obj_angleY += dAY;
  } else {
    this.light_angleY += dAY;
  }
}

OBJDraw.prototype.setObjLight = function(obj) {
  this.updateObj = obj;
}


OBJDraw.prototype.setPointLight = function(ptLight) {
  this.ptLight = ptLight;
}

OBJDraw.prototype.setProjMatrix = function(projMatrix) {
  this.projMatrix = projMatrix;
}


// function draw(gl, program, angle, viewProjMatrix, model) {
OBJDraw.prototype.draw = function() {
  if (g_OBJ_DOC != null && g_OBJ_DOC.isMTLComplete()){ // OBJ and all MTLs are available
    this.drawingInfo = onReadComplete(this.model, g_OBJ_DOC);
    g_OBJ_DOC = null;
  } 
  if (!this.drawingInfo) return;   // 

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

  var dRotate = new Matrix4();
  dRotate.setRotate(this.obj_angleY, 0.0, 1.0, 0.0);
  var angleY = Math.PI * this.obj_angleY / 180; 
  dRotate.rotate(this.obj_angleX, Math.cos(angleY), -Math.sin(angleY), 0.0); 
  dRotate.multiply(this.trackball);
  this.trackball.set(dRotate);
  this.obj_angleX = 0.0;
  this.obj_angleY = 0.0;
	
  var rotMatrix = new Matrix4(this.trackball);
  rotMatrix.rotate(this.currentAngle, 1.0, 0.0, 0.0); 
  rotMatrix.rotate(this.currentAngle, 0.0, 1.0, 0.0);
  rotMatrix.rotate(this.currentAngle, 0.0, 0.0, 1.0);

  this.modelMatrix.set( rotMatrix );
  this.modelMatrix.scale(1.0/this.drawingInfo.scale, 1.0/this.drawingInfo.scale, 1.0/this.drawingInfo.scale); 
  this.modelMatrix.translate(-this.drawingInfo.center.x, 
			     -this.drawingInfo.center.y,
			     -this.drawingInfo.center.z );

  // Could send the projection matrix only once - currently fixed
  gl.uniformMatrix4fv(this.program.u_PMatrix, false, this.projMatrix.elements);
  this.mvMatrix.set(this.viewMatrix);		      
  this.mvMatrix.multiply(this.modelMatrix);
  gl.uniformMatrix4fv(this.program.u_MvMatrix, false, this.mvMatrix.elements);

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  this.normalMatrix.set(this.viewMatrix);
  // set translate to 0
  this.normalMatrix.elements[12] = 0.0;
  this.normalMatrix.elements[13] = 0.0;
  this.normalMatrix.elements[14] = 0.0;
  this.normalMatrix.multiply(rotMatrix);
  // assume no non-uniform scaling. i.e., need no inverse, transpose
  gl.uniformMatrix4fv(this.program.u_NormalMatrix, false, this.normalMatrix.elements);

  if (this.light_angleY < 0.0) this.light_angleY += 360;
  this.light_angleY %= 360;
  // if (this.light_angleX < 0.0) this.light_angleX = -this.light_angleX;
  // this.light_angleX %= 180;
  if (this.light_angleX < 0.0) this.light_angleX += 360;
  this.light_angleX %= 360;
  var ele = Math.PI * this.light_angleX / 180; 
  var azi = Math.PI * this.light_angleY / 180;
  var lightDir;
  if ( this.ptLight ) {
    // point light source - uses hardcoded model size and position 
    lightDir = new Vector4([3.0*Math.sin(ele)*Math.cos(azi),
   			    3.0*Math.cos(ele),
			    -3.0*Math.sin(ele)*Math.sin(azi) - 5.5,
   			    1.0 ]);
  } else {
    // directional lighting
    lightDir = new Vector4([Math.sin(ele)*Math.cos(azi),
  			    Math.cos(ele),
  			    -Math.sin(ele)*Math.sin(azi),
  			    0.0 ]);
  }
  gl.uniform4fv(this.program.u_lightDir, lightDir.elements);
  // Draw
  gl.drawElements(gl.TRIANGLES, this.drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}
