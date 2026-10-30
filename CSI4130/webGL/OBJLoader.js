// ==========================================================================
// $Id: OBJLoader.js,v 1.1 2015/03/08 05:52:44 jlang Exp $
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
// $Log: OBJLoader.js,v $
// Revision 1.1  2015/03/08 05:52:44  jlang
// Coded OBJViewer user interface, created OBJDraw and OBJLoader files
//
// ==========================================================================
// Based on (c) 2012 matsuda
// OBJViewer.js

var g_OBJ_DOC = null;      // The information of OBJ file - global for asynch reading

// Read a file
function readOBJFile(fileName, gl, scale, reverse) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
    }
  }
  request.open('GET', fileName, true); // Create a request to acquire the file
  request.send();                      // Send the request
}

// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, scale, reverse) {
  var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
  var result = objDoc.parse(fileString, scale, reverse); // Parse the file
  if (!result) {
    g_OBJ_DOC = null; 
    console.log("OBJ file parsing error.");
    return;
  }
  g_OBJ_DOC = objDoc;
}


//------------------------------------------------------------------------------
// OBJParser
//------------------------------------------------------------------------------

// OBJDoc object
// Constructor
var OBJDoc = function(fileName) {
  this.fileName = fileName;
  this.mtls = new Array(0);      // Initialize the property for MTL
  this.objects = new Array(0);   // Initialize the property for Object
  this.vertices = new Array(0);  // Initialize the property for Vertex
  this.normals = new Array(0);   // Initialize the property for Normal
}

// Parsing the OBJ file
OBJDoc.prototype.parse = function(fileString, scale, reverse) {
  var lines = fileString.split('\n');  // Break up into lines and store them as array
  lines.push(null); // Append null
  var index = 0;    // Initialize index of line

  var currentObject = new OBJObject('default'); // Use a deafult object name
  this.objects.push(currentObject);
  var currentMaterialName = "";
  
  // Parse line by line
  var line;         // A string in the line to be parsed
  var sp = new StringParser();  // Create StringParser
  while ((line = lines[index++]) != null) {
    sp.init(line);                  // init StringParser
      var command = sp.getWord();     // Get command
      if(command == null)	 continue;  // check null command

    if ( command.charAt(0) == '#' ) continue;

    switch(command){
//    case '#':
//      continue;  // Skip comments
    case 'mtllib':     // Read Material chunk
      var path = this.parseMtllib(sp, this.fileName);
      var mtl = new MTLDoc();   // Create MTL instance
      this.mtls.push(mtl);
      var request = new XMLHttpRequest();
      request.onreadystatechange = function() {
        if (request.readyState == 4) {
          if (request.status != 404) {
            onReadMTLFile(request.responseText, mtl);
          }else{
            mtl.complete = true;
          }
        }
      }
      request.open('GET', path, true);  // Create a request to acquire the file
      request.send();                   // Send the request
      continue; // Go to the next line
    case 'o':
    case 'g':   // Read Object name
      var object = this.parseObjectName(sp);
      this.objects.push(object);
      currentObject.scale = currentObject.extrema.scale();
      currentObject = object;
      continue; // Go to the next line
    case 'v':   // Read vertex
      var vertex = this.parseVertex(sp, scale);
      currentObject.extrema.compare( vertex );
      this.vertices.push(vertex); 
      continue; // Go to the next line
    case 'vn':   // Read normal
      var normal = this.parseNormal(sp);
      this.normals.push(normal); 
      continue; // Go to the next line
    case 'usemtl': // Read Material name
      currentMaterialName = this.parseUsemtl(sp);
      continue; // Go to the next line
    case 'f': // Read face
      var face = this.parseFace(sp, currentMaterialName, this.vertices, reverse);
      currentObject.addFace(face);
      continue; // Go to the next line
    }
  }
  currentObject.scale = currentObject.extrema.scale(); 
  return true;
}

OBJDoc.prototype.parseMtllib = function(sp, fileName) {
  // Get directory path
  var i = fileName.lastIndexOf("/");
  var dirPath = "";
  if(i > 0) dirPath = fileName.substr(0, i+1);

  return dirPath + sp.getWord();   // Get path
}

OBJDoc.prototype.parseObjectName = function(sp) {
  var name = sp.getWord();
  return (new OBJObject(name));
}

OBJDoc.prototype.parseVertex = function(sp, scale) {
  var x = sp.getFloat() * scale;
  var y = sp.getFloat() * scale;
  var z = sp.getFloat() * scale;
  return (new Vertex(x, y, z));
}

OBJDoc.prototype.parseNormal = function(sp) {
  var x = sp.getFloat();
  var y = sp.getFloat();
  var z = sp.getFloat();
  return (new Normal(x, y, z));
}

OBJDoc.prototype.parseUsemtl = function(sp) {
  return sp.getWord();
}

OBJDoc.prototype.parseFace = function(sp, materialName, vertices, reverse) {  
  var face = new Face(materialName);
  // get indices
  for(;;){
    var word = sp.getWord();
    if(word == null) break;
    var subWords = word.split('/');
    if(subWords.length >= 1){
      var vi = parseInt(subWords[0]) - 1;
      face.vIndices.push(vi);
    }
    if(subWords.length >= 3){
      var ni = parseInt(subWords[2]) - 1;
      face.nIndices.push(ni);
    }else{
      face.nIndices.push(-1);
    }
  }

  // calc normal
  var v0 = [
    vertices[face.vIndices[0]].x,
    vertices[face.vIndices[0]].y,
    vertices[face.vIndices[0]].z];
  var v1 = [
    vertices[face.vIndices[1]].x,
    vertices[face.vIndices[1]].y,
    vertices[face.vIndices[1]].z];
  var v2 = [
    vertices[face.vIndices[2]].x,
    vertices[face.vIndices[2]].y,
    vertices[face.vIndices[2]].z];

  // face normal via cross product
  var normal = calcNormal(v0, v1, v2);
  // Check if colinear
  if (normal == null) {
    if (face.vIndices.length >= 4) { // Quad or Polygon
      var v3 = [
        vertices[face.vIndices[3]].x,
        vertices[face.vIndices[3]].y,
        vertices[face.vIndices[3]].z];
      normal = calcNormal(v1, v2, v3);
    }
    if(normal == null){         // Use default normal
      normal = [0.0, 1.0, 0.0];
    }
  }
  if(reverse){
    normal[0] = -normal[0];
    normal[1] = -normal[1];
    normal[2] = -normal[2];
  }
  face.normal = new Normal(normal[0], normal[1], normal[2]);

  // Devide to triangles if face contains over 3 points.
  if(face.vIndices.length > 3){
    var n = face.vIndices.length - 2;
    var newVIndices = new Array(n * 3);
    var newNIndices = new Array(n * 3);
    for(var i=0; i<n; i++){
      newVIndices[i * 3 + 0] = face.vIndices[0];
      newVIndices[i * 3 + 1] = face.vIndices[i + 1];
      newVIndices[i * 3 + 2] = face.vIndices[i + 2];
      newNIndices[i * 3 + 0] = face.nIndices[0];
      newNIndices[i * 3 + 1] = face.nIndices[i + 1];
      newNIndices[i * 3 + 2] = face.nIndices[i + 2];
    }
    face.vIndices = newVIndices;
    face.nIndices = newNIndices;
  }
  face.numIndices = face.vIndices.length;

  return face;
}

// Analyze the material file
function onReadMTLFile(fileString, mtl) {
  var lines = fileString.split('\n');  // Break up into lines and store them as array
  lines.push(null);           // Append null
  var index = 0;              // Initialize index of line

  // Parse line by line
  var line;      // A string in the line to be parsed
  var name = ""; // Material name
  var sp = new StringParser();  // Create StringParser
  while ((line = lines[index++]) != null) {
    sp.init(line);                  // init StringParser
    var command = sp.getWord();     // Get command
    if(command == null)	 continue;  // check null command

    switch(command){
    case '#':
      continue;    // Skip comments
    case 'newmtl': // Read Material chunk
      name = mtl.parseNewmtl(sp);    // Get name
      continue; // Go to the next line
    case 'Kd':   // Read normal
      if(name == "") continue; // Go to the next line because of Error
      var material = mtl.parseRGB(sp, name);
      mtl.materials.push(material);
      name = "";
      continue; // Go to the next line
    }
  }
  mtl.complete = true;
}

// Check Materials
OBJDoc.prototype.isMTLComplete = function() {
  if(this.mtls.length == 0) return true;
  for(var i = 0; i < this.mtls.length; i++){
    if(!this.mtls[i].complete) return false;
  }
  return true;
}

// Find color by material name
OBJDoc.prototype.findColor = function(name){
  for(var i = 0; i < this.mtls.length; i++){
    for(var j = 0; j < this.mtls[i].materials.length; j++){
      if(this.mtls[i].materials[j].name == name){
        return(this.mtls[i].materials[j].color)
      }
    }
  }
  return(new Color(0.8, 0.8, 0.8, 1));
}

//------------------------------------------------------------------------------
// Retrieve the information for drawing 3D model
OBJDoc.prototype.getDrawingInfo = function() {
  // Create arrays for vertex coordinates, normals, colors, and indices
  var numIndices = 0;
  for(var i = 0; i < this.objects.length; i++){
    numIndices += this.objects[i].numIndices;
  }
  var numVertices = numIndices;
  var vertices = new Float32Array(numVertices * 3);
  var normals = new Float32Array(numVertices * 3);
  var colors = new Float32Array(numVertices * 4);
  var indices = new Uint16Array(numIndices);
  var extrema = new Extrema3();

  // Set vertex, normal and color
  var index_indices = 0;
  for(var i = 0; i < this.objects.length; i++){
    var object = this.objects[i];
    extrema.update( object.extrema );
    for(var j = 0; j < object.faces.length; j++){
      var face = object.faces[j];
      var color = this.findColor(face.materialName);
      var faceNormal = face.normal;
      for(var k = 0; k < face.vIndices.length; k++){
        // Set index
        indices[index_indices] = index_indices;
        // Copy vertex
        var vIdx = face.vIndices[k];
        var vertex = this.vertices[vIdx];
        vertices[index_indices * 3 + 0] = vertex.x;
        vertices[index_indices * 3 + 1] = vertex.y;
        vertices[index_indices * 3 + 2] = vertex.z;
        // Copy color
        colors[index_indices * 4 + 0] = color.r;
        colors[index_indices * 4 + 1] = color.g;
        colors[index_indices * 4 + 2] = color.b;
        colors[index_indices * 4 + 3] = color.a;
        // Copy normal
        var nIdx = face.nIndices[k];
        if(nIdx >= 0){
          var normal = this.normals[nIdx];
          normals[index_indices * 3 + 0] = normal.x;
          normals[index_indices * 3 + 1] = normal.y;
          normals[index_indices * 3 + 2] = normal.z;
        }else{
          normals[index_indices * 3 + 0] = faceNormal.x;
          normals[index_indices * 3 + 1] = faceNormal.y;
          normals[index_indices * 3 + 2] = faceNormal.z;
        }
        index_indices ++;
      }
    }
  }

  var scale = extrema.scale();
  var center = extrema.center();

  return new DrawingInfo(vertices, normals, colors, indices, scale, center);
}

//------------------------------------------------------------------------------
// MTLDoc Object
//------------------------------------------------------------------------------
var MTLDoc = function() {
  this.complete = false; // MTL is configured correctly
  this.materials = new Array(0);
}

MTLDoc.prototype.parseNewmtl = function(sp) {
  return sp.getWord();         // Get name
}

MTLDoc.prototype.parseRGB = function(sp, name) {
  var r = sp.getFloat();
  var g = sp.getFloat();
  var b = sp.getFloat();
  return (new Material(name, r, g, b, 1));
}

//------------------------------------------------------------------------------
// Material Object
//------------------------------------------------------------------------------
var Material = function(name, r, g, b, a) {
  this.name = name;
  this.color = new Color(r, g, b, a);
}

//------------------------------------------------------------------------------
// Vertex Object
//------------------------------------------------------------------------------
var Vertex = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

//------------------------------------------------------------------------------
// Normal Object
//------------------------------------------------------------------------------
var Normal = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

//------------------------------------------------------------------------------
// Color Object
//------------------------------------------------------------------------------
var Color = function(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
}

//------------------------------------------------------------------------------
// OBJObject Object
//------------------------------------------------------------------------------
var OBJObject = function(name) {
  this.name = name;
  this.faces = new Array(0);
  this.numIndices = 0;
  this.extrema = new Extrema3(); // Extrema X/Y/Z
}

OBJObject.prototype.addFace = function(face) {
  this.faces.push(face);
  this.numIndices += face.numIndices;
}

//------------------------------------------------------------------------------
// Face Object
//------------------------------------------------------------------------------
var Face = function(materialName) {
  this.materialName = materialName;
  if(materialName == null)  this.materialName = "";
  this.vIndices = new Array(0);
  this.nIndices = new Array(0);
}

//------------------------------------------------------------------------------
// DrawInfo Object
//------------------------------------------------------------------------------
var DrawingInfo = function(vertices, normals, colors, indices, scale, center ) {
  this.vertices = vertices;
  this.normals = normals;
  this.colors = colors;
  this.indices = indices;
  this.scale = scale;
  this.center = center;
}

//------------------------------------------------------------------------------
// Constructor
var StringParser = function(str) {
  this.str;   // Store the string specified by the argument
  this.index; // Position in the string to be processed
  this.init(str);
}
// Initialize StringParser object
StringParser.prototype.init = function(str){
  this.str = str;
  this.index = 0;
}

// Skip delimiters
StringParser.prototype.skipDelimiters = function()  {
  for(var i = this.index, len = this.str.length; i < len; i++){
    var c = this.str.charAt(i);
    // Skip TAB, Space, '(', ')
    if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"') continue;
    break;
  }
  this.index = i;
}

// Skip to the next word
StringParser.prototype.skipToNextWord = function() {
  this.skipDelimiters();
  var n = getWordLength(this.str, this.index);
  this.index += (n + 1);
}

// Get word
StringParser.prototype.getWord = function() {
  this.skipDelimiters();
  var n = getWordLength(this.str, this.index);
  if (n == 0) return null;
  var word = this.str.substr(this.index, n);
  this.index += (n + 1);

  return word;
}

// Get integer
StringParser.prototype.getInt = function() {
  return parseInt(this.getWord());
}

// Get floating number
StringParser.prototype.getFloat = function() {
  return parseFloat(this.getWord());
}

// Get the length of word
function getWordLength(str, start) {
  var n = 0;
  for(var i = start, len = str.length; i < len; i++){
    var c = str.charAt(i);
    if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"') 
	break;
  }
  return i - start;
}

//------------------------------------------------------------------------------
// Common function
//------------------------------------------------------------------------------
function calcNormal(p0, p1, p2) {
  // v0: a vector from p1 to p0, v1; a vector from p1 to p2
  var v0 = new Float32Array(3);
  var v1 = new Float32Array(3);
  for (var i = 0; i < 3; i++){
    v0[i] = p0[i] - p1[i];
    v1[i] = p2[i] - p1[i];
  }

  // The cross product of v0 and v1
  var c = new Float32Array(3);
  c[0] = v0[1] * v1[2] - v0[2] * v1[1];
  c[1] = v0[2] * v1[0] - v0[0] * v1[2];
  c[2] = v0[0] * v1[1] - v0[1] * v1[0];

  // Normalize the result
  var v = new Vector3(c);
  v.normalize();
  return v.elements;
}



/**
 * Constructor of Extrema 3
 * Keep track of the min/max values of mesh vertices
 * @param opt_src source vector(option)
 */
var Extrema3 = function(opt_src) {
  var minVal = new Vertex();
  var maxVal = new Vertex();
  if (opt_src && typeof opt_src === 'object') {
    minVal.x = maxVal.x = opt_src.x; 
    minVal.y = maxVal.y = opt_src.y; 
    minVal.z = maxVal.z = opt_src.z;
  } else {
    minVal.x = minVal.y = minVal.z = Infinity;
    maxVal.x = maxVal.y = maxVal.z = -Infinity;
  }
  this.minVal = minVal;
  this.maxVal = maxVal;
}


/**
  * Compare and update the current extrema with pt values.
  * @return this
  */
Extrema3.prototype.compare = function(pt) {
  this.minVal.x = (this.minVal.x <= pt.x) ? this.minVal.x : pt.x; 
  this.minVal.y = (this.minVal.y <= pt.y) ? this.minVal.y : pt.y; 
  this.minVal.z = (this.minVal.z <= pt.z) ? this.minVal.z : pt.z; 
  this.maxVal.x = (this.maxVal.x > pt.x) ? this.maxVal.x : pt.x; 
  this.maxVal.y = (this.maxVal.y > pt.y) ? this.maxVal.y : pt.y; 
  this.maxVal.z = (this.maxVal.z > pt.z) ? this.maxVal.z : pt.z; 

  return this;
};


Extrema3.prototype.update = function( other ) {
  this.compare( other.minVal );
  this.compare( other.maxVal );
  return this;
};


/**
  * Get center range.
  * @return center as Vector3
  */
Extrema3.prototype.center = function() {
  var c = new Vertex();
  c.x =  (this.maxVal.x + this.minVal.x)/2.0;
  c.y =  (this.maxVal.y + this.minVal.y)/2.0;
  c.z =  (this.maxVal.z + this.minVal.z)/2.0;
  return c;
};


/**
  * Get scale 
  * 1/scale makes the model unit size.
  * @return scale as float
  */
Extrema3.prototype.scale = function() {
  var scale = Math.abs(this.maxVal.x - this.minVal.x);

  scale = ( scale < Math.abs(this.maxVal.y - this.minVal.y)) ? 
    Math.abs(this.maxVal.y - this.minVal.y) : scale;
  scale = ( scale < Math.abs(this.maxVal.z - this.minVal.z)) ? 
    Math.abs(this.maxVal.z - this.minVal.z) : scale;

  return scale;
};
