export const demoLog = `[Unity Demo]
Compiling shader "Universal Render Pipeline/Lit" pass "ForwardLit" (fp)
320 / 786432 variants left after stripping, processed in 6.77 seconds
finished in 29.72 seconds. Local cache hits 202 (0.24s CPU time), remote cache hits 0 (0.00s), compiled 118 variants (582.41s CPU time), skipped 0 variants
STRIPPING: Universal Render Pipeline/Lit (ForwardLit pass) (Fragment) - Remaining shader variants = 640/5760 = 11.11111% - Total = 2657/10169 = 26.12843%
Shader error in 'Custom/Water': unexpected token near line 28

[Unreal Demo]
[2026.01.26-14.56.46:647][887]LogShaderCompilers: Warning: Failed to compile Material /Engine/BufferVisualization/AmbientOcclusion.AmbientOcclusion for platform PCD3D_SM6, Default Material will be used in game.
LogShaderCompilers: Error: ShaderCompileWorker terminated unexpectedly, return code -1073741819! Falling back to directly compiling.
D:/Project/Saved/ShaderDebugInfo/PCD3D_SM6/M_Sparks/Default/Vertex/0_123456

[Godot Demo]
ERROR: Shader compilation failed. At: res://shaders/dissolve.gdshader:14
  ERROR: Unknown identifier in expression: 'VIEW'

[Unrecognized]
LogTemp: Display: Build started
`;
