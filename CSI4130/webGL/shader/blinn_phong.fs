// ==========================================================================
// $Id: blinn_phong.fs,v 1.3 2015/03/09 23:08:17 jlang Exp $
// Basic Phong shading emulating fixed pipeline functionality
// ==========================================================================
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
// $Log: blinn_phong.fs,v $
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

#ifdef GL_ES
precision highp float;
#endif


struct Light {
  vec4 ambient;
  vec4 diffuse;
  vec4 specular;
}; 

struct Material {
  vec4 ambient;
  vec4 diffuse;
  vec4 specular;
  int shininess;
};

uniform Light light_source;
uniform Material material;

varying vec3 normalVec, lightVec, eyeVec;
varying vec4 frag_color;

void main() {
  vec3 NVec = normalize(normalVec);
  vec3 LVec = normalize(lightVec);
  vec3 EVec = normalize(eyeVec);

  // ambient term
  vec4 ambient = material.ambient * light_source.ambient;

  // diffuse term
  float dotNL = max(0.0,dot(NVec,LVec));
  vec4 diffuse = material.diffuse * light_source.diffuse * dotNL;

  vec4 specular = vec4(0.0);
  // vec3 HVec;
  // float dotNH;
  if ( dotNL > 0.0 ) {
    vec3 HVec = normalize(LVec+EVec);
    float dotNH = max(0.0,dot(NVec,HVec));
    specular = material.specular * light_source.specular 
      * pow(dotNH, float(material.shininess));
  } 

  // color
  gl_FragColor = frag_color * ( ambient + diffuse + specular );
  gl_FragColor.a = 1.0; 
}
