// ==========================================================================
// $Id: triangle.fs,v 1.1 2015/01/08 15:31:45 jlang Exp $
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
// $Log: triangle.fs,v $
// Revision 1.1  2015/01/08 15:31:45  jlang
// Created simple triangle rasterization example
//
//
// ==========================================================================
#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec3 v_color;

void main() {
  // Pass on the fragment color to the frame buffer
  gl_FragColor = vec4( v_color, 1.0 );
}
