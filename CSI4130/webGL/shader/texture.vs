// ==========================================================================
// $Id: texture.vs,v 1.1 2015/02/01 06:24:06 jlang Exp $
// Basic 2D texturing
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
// $Log: texture.vs,v $
// Revision 1.1  2015/02/01 06:24:06  jlang
// Created texture example
//
// ==========================================================================
#version 100

uniform mat4 mvp_matrix;

attribute vec4 a_vertex;
attribute vec2 a_texCoord;

varying vec2 texCoordFrag;

void main() {
  gl_Position = mvp_matrix * a_vertex;
  // Pass vertex texture coordinates on to rasterizer
  texCoordFrag = a_texCoord;
}
