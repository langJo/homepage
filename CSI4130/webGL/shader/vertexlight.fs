// ==========================================================================
// $Id: vertexlight.fs,v 1.1 2015/02/23 20:48:59 jlang Exp $
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
// $Log: vertexlight.fs,v $
// Revision 1.1  2015/02/23 20:48:59  jlang
// Added mesh viewer
//
// ==========================================================================
#version 100

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D img2DSampler;

varying vec4 v_color;
// varying vec2 texCoordFrag;

void main() {
  // color from texture
  
  gl_FragColor = v_color;
}
