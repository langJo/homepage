// ==========================================================================
// $Id: lighting.vs,v 1.3 2015/03/09 23:08:17 jlang Exp $
// Basic Phong shading emulating fixed pipeline functionality
// ===================================================================
// (C)opyright:
//
//   Jochen Lang
//   SITE, University of Ottawa
//   800 King Edward Ave.
//   Ottawa, On., K1N 6N5
//   Canada.
//   http://www.site.uottawa.ca
//
// Creator: jlang (Jochen Lang)
// Email:   jlang@site.uottawa.ca
// ==========================================================================
// $Log: lighting.vs,v $
// Revision 1.3  2015/03/09 23:08:17  jlang
// Update to material and blinn-phong with diffuse cut-off.
//
// Revision 1.2  2015/03/09 18:35:09  jlang
// Updated structure definitions to work on Windows.
//
// Revision 1.1  2015/03/09 04:10:49  jlang
// Blinn-Phong, Cook-Torrance lighting, version 1
//
// ==========================================================================
#version 100

// #ifdef GL_ES
// precision mediump float;
// #endif

uniform mat4 mv_matrix;
uniform mat4 p_matrix;
uniform mat4 normal_matrix;

uniform vec4 lightDir;

attribute vec4 a_vertex;
attribute vec4 a_color;
attribute vec4 a_normal;

varying vec3 normalVec, lightVec, eyeVec;
varying vec4 frag_color;

void main() {
  // map the vertex position into clipping space 
  vec4 posVec = mv_matrix * a_vertex;

  // map the vertex position in camera coordinates
  gl_Position = p_matrix  * posVec; 
  
  // camera coordinate normal
  vec4 nVec = normal_matrix * a_normal;
  normalVec = nVec.xyz;

  // light vector in camera coordinates
  // Check for directional lighting	
  if ( abs(lightDir.w) > 0.0001 ) {
    lightVec = lightDir.xyz - posVec.xyz;
  } else {
    lightVec = lightDir.xyz;
  }

  // eyeVec
  eyeVec = -posVec.xyz;
  frag_color = a_color;
}
