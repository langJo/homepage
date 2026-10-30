// ==========================================================================
// $Id: triangle.vs,v 1.1 2015/01/08 15:31:45 jlang Exp $
// Basic colored triangle rendering
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
// $Log: triangle.vs,v $
// Revision 1.1  2015/01/08 15:31:45  jlang
// Created simple triangle rasterization example
//
//
// ==========================================================================
#version 100

uniform mat4 mvp_matrix;

attribute vec4 a_vertex;	
attribute vec3 a_color; 	

varying vec3 v_color;

void main() {
  // map the vertex position into normalized device coordinates 
  gl_Position = mvp_matrix * a_vertex;

  // Pass on the color to the fragment shader
  v_color = a_color;
}
