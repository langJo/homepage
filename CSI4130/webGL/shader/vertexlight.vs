// ==========================================================================
// $Id: vertexlight.vs,v 1.2 2015/03/08 05:52:44 jlang Exp $
// Basic mesh display
// ===================================================================
// (C)opyright:
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
// $Log: vertexlight.vs,v $
// Revision 1.2  2015/03/08 05:52:44  jlang
// Coded OBJViewer user interface, created OBJDraw and OBJLoader files
//
// Revision 1.1  2015/02/23 20:48:59  jlang
// Added mesh viewer
//
// ==========================================================================
#version 100

uniform mat4 mvp_matrix;
uniform mat4 normal_matrix;

uniform vec3 lightDir;

attribute vec4 a_vertex;
attribute vec4 a_color;
attribute vec4 a_normal;

// attribute vec2 a_texCoord;

varying vec4 v_color;
// varying vec2 texCoordFrag;

void main() {
  // vec3 lightDir = vec3(-0.35, 0.35, 0.87);
  gl_Position = mvp_matrix * a_vertex;
  vec3 normal = normalize(vec3(normal_matrix * a_normal));
  float nDotL = max(dot(normal, lightDir), 0.0);
  v_color = vec4(a_color.rgb * nDotL, a_color.a);

  // Pass vertex texture coordinates on to rasterizer
  // texCoordFrag = a_texCoord;
}
