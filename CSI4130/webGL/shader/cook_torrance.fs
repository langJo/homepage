// ==========================================================================
// $Id: cook_torrance.fs,v 1.3 2015/03/09 23:43:38 jlang Exp $
// Cook Torrance BRDF
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
// $Log: cook_torrance.fs,v $
// Revision 1.3  2015/03/09 23:43:38  jlang
// Check-in for A3
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
  const int NUM_DISTR = 2;
  // roughness
  vec2 m = vec2( 0.4, 0.2 );
  // weights
  vec2 w = vec2( 0.4, 0.6 );
  // red, green, blue  index of refraction
  // calculated from table 4a) n = 1+sqrt(F0)/(1-sqrt(F0)
  const vec3 F0 = vec3( 0.75, 0.25, 0.1 );
  const vec3 refIndex = vec3( 13.9, 3.0, 1.9 );
  // no diffuse reflectance
  const float rhoD = 0.0;
  // all specular
  const float rhoS = 1.0;	

  vec3 NVec = normalize(normalVec);
  vec3 LVec = normalize(lightVec);
  vec3 EVec = normalize(eyeVec);
  vec3 HVec = normalize(LVec+EVec);

  // ambient term
  vec4 ambient = 0.25 * vec4(F0,1.0) * light_source.ambient;

  // diffuse term
  float dotNL = max(0.0,dot(NVec,LVec));

  // calculate specular lighting
  vec4 Rs = vec4(0.0);
  if (dotNL > 0.0) {
    // Fresnel term (unpolarized light)
    float dotEH = dot(EVec,HVec);
    vec3 gFres = sqrt( refIndex*refIndex + vec3(dotEH*dotEH-1.0) ); 
    vec3 vDotEH = vec3( dotEH );
    vec3 fresnel = 0.5 * (gFres - vDotEH)*(gFres - vDotEH)
      /(gFres + vDotEH)/(gFres + vDotEH) * 
      (vec3(1.0) + (vDotEH*(gFres+vDotEH)-vec3(1.0))*(vDotEH*(gFres+vDotEH)-vec3(1.0))/
       ((vDotEH*(gFres-vDotEH)+vec3(1.0))*(vDotEH*(gFres-vDotEH)+vec3(1.0))));
    
    // Facet Distributions
    float dotNH = dot( NVec, HVec );
    float beta = acos( dotNH );
    float distr =0.0;
    for ( int i=0; i<NUM_DISTR; ++i ) {
      float denom = 1.0/( 4.0*m[i] *m[i] * pow(dotNH,4.0));
      float expX = tan(beta)/m[i];
      distr += w[i] * denom * exp( -expX*expX);  
    }
    
    // Geometry term
    float dotNL = dot(NVec,LVec);
    float dotNE = dot(NVec,EVec);
    float mask = 2.0 * dotNH * dotNE/dotEH;
    float shadow = 2.0 * dotNH * dotNL/dotEH;
    float geom = min( mask, shadow );
    geom = min( 1.0, geom ); 
  
    float rough = distr * geom/ dotNE / dotNL; 
    Rs = vec4(fresnel * rough/3.14159265,1.0);
  }
  vec4 Rd = vec4(F0/3.14159265,1.0);
  // sum all components -- assume diffuse and specular light source are the same
  vec4 lightAvg = 0.5 * (light_source.diffuse + light_source.specular);

  gl_FragColor = frag_color *  ( ambient + lightAvg * dotNL * ( rhoD * Rd + rhoS * Rs ));
  gl_FragColor.a = 1.0;
}
