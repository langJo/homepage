// ==========================================================================
// $Id: texture.fs,v 1.1 2015/02/01 06:24:06 jlang Exp $
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
// $Log: texture.fs,v $
// Revision 1.1  2015/02/01 06:24:06  jlang
// Created texture example
//
// ==========================================================================
#version 100

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D img2DSampler;

varying vec2 texCoordFrag;

void main() {
  // color from texture
  gl_FragColor = texture2D(img2DSampler,texCoordFrag);
}
