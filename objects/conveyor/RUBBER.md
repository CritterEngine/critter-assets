# Diamond-grip conveyor rubber

Original procedural texture set, CC0-1.0. No external texture sources.

The shared 512 × 2560 atlas covers 1 metre across and 5 metres along the belt.
Its diagonal pattern repeats every 40 mm along each texture axis, with 0.65 mm
visual relief. Color uses sRGB; normal (OpenGL +Y) and roughness use linear data.
All three images use the same UVs. Metallic is zero; roughness multiplier is one.

Regenerate images with Blender:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python generate-rubber.py
```

Regenerate all six MJCF variants and belt UVs:

```powershell
pnpm exec node generate.mjs
```

The long belt has a separate UV mesh to retain physical pattern scale. Curves
map across their radius and along their centreline arc, so the inner edge
compresses and the outer edge expands naturally. Physics geoms, friction,
actuators, and movement are unchanged. The existing visual belt skin is static;
the normal map does not create physical grip or animate the surface.

The generator also writes a packed `rubber-material.blend` and material sample
preview for authoring. Only the XML, OBJ, and textures are required at runtime.
