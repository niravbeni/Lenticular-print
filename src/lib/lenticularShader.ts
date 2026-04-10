export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// The key insight: in a real lenticular print, every lens shows the SAME
// image at a given viewing angle. The angle alone determines which frame
// is visible — not the per-pixel position within a lens. Lens position
// only matters for the subtle ridge/gap visual effect.
export const fragmentShader = /* glsl */ `
  uniform sampler2D uTex0;
  uniform sampler2D uTex1;
  uniform sampler2D uTex2;
  uniform sampler2D uTex3;
  uniform sampler2D uTex4;
  uniform sampler2D uTex5;
  uniform int uNumFrames;
  uniform float uAngle;
  uniform float uLensCount;
  uniform vec3 uCameraPos;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  vec4 sampleFrame(int idx, vec2 uv) {
    if (idx == 0) return texture2D(uTex0, uv);
    if (idx == 1) return texture2D(uTex1, uv);
    if (idx == 2) return texture2D(uTex2, uv);
    if (idx == 3) return texture2D(uTex3, uv);
    if (idx == 4) return texture2D(uTex4, uv);
    return texture2D(uTex5, uv);
  }

  void main() {
    // --- Image selection based on viewing angle ---
    // uAngle ranges from -1 (tilted left) to +1 (tilted right).
    // Map to a 0..1 range, then to a frame index.
    float t = clamp((uAngle + 1.0) * 0.5, 0.0, 1.0);
    float frameF = t * float(uNumFrames - 1);
    int idx = int(floor(frameF));
    int nextIdx = min(idx + 1, uNumFrames - 1);
    float blend = fract(frameF);

    vec4 colorA = sampleFrame(idx, vUv);
    vec4 colorB = sampleFrame(nextIdx, vUv);

    // Transition zone: sharp snap with a narrow smooth blend
    float blendT = smoothstep(0.35, 0.65, blend);
    vec4 color = mix(colorA, colorB, blendT);

    // --- Lens ridge visual effect ---
    // Purely cosmetic: darkens thin lines at the boundaries between
    // cylindrical lenses to make it look like a real lens sheet.
    float lensPhase = fract(vUv.x * uLensCount);
    float ridge = smoothstep(0.0, 0.015, lensPhase)
                * smoothstep(1.0, 0.985, lensPhase);
    color.rgb *= mix(0.6, 1.0, ridge);

    // --- Specular highlight on the glossy lens surface ---
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    vec3 lightDir = normalize(vec3(0.3, 1.0, 0.8));
    vec3 halfDir = normalize(viewDir + lightDir);
    float spec = pow(max(dot(vNormal, halfDir), 0.0), 80.0);
    color.rgb += vec3(spec * 0.12);

    // --- Fresnel edge tint (plastic sheen at steep angles) ---
    float fresnel = 1.0 - max(dot(vNormal, viewDir), 0.0);
    fresnel = pow(fresnel, 4.0);
    color.rgb = mix(color.rgb, color.rgb * 1.05 + vec3(0.01, 0.02, 0.04), fresnel * 0.25);

    gl_FragColor = color;
  }
`;
