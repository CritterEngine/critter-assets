import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MODULE_LENGTH = 2.5;
const BELT_TILE_LENGTH = 0.5;
const BELT_WRAP_HALF_TRAVEL = 0.05;
const HANDOFF_OVERLAP = 0.04;
const CURVE_RADIUS = 1.25;

const straightVariants = [
  {
    filename: "conveyor.xml",
    model: "conveyor",
    bodyName: "conveyor",
    moduleCount: 1,
  },
  {
    filename: "conveyor-long.xml",
    model: "conveyor_long",
    bodyName: "conveyor_long",
    moduleCount: 2,
  },
];

const curveVariants = [
  {
    filename: "conveyor-curve-left.xml",
    model: "conveyor_curve_left",
    bodyName: "conveyor_curve_left",
    id: "left",
    direction: 1,
    angle: Math.PI / 2,
    segmentCount: 10,
    meshSteps: 32,
  },
  {
    filename: "conveyor-curve-right.xml",
    model: "conveyor_curve_right",
    bodyName: "conveyor_curve_right",
    id: "right",
    direction: -1,
    angle: Math.PI / 2,
    segmentCount: 10,
    meshSteps: 32,
  },
  {
    filename: "conveyor-curve-left-45.xml",
    model: "conveyor_curve_left_45",
    bodyName: "conveyor_curve_left_45",
    id: "left-45",
    direction: 1,
    angle: Math.PI / 4,
    segmentCount: 5,
    meshSteps: 16,
  },
  {
    filename: "conveyor-curve-right-45.xml",
    model: "conveyor_curve_right_45",
    bodyName: "conveyor_curve_right_45",
    id: "right-45",
    direction: -1,
    angle: Math.PI / 4,
    segmentCount: 5,
    meshSteps: 16,
  },
];

const formatNumber = (value) => {
  const rounded = Math.round(value * 1e9) / 1e9;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

const formatVector = (values) => values.map(formatNumber).join(" ");

const curvePoint = ({ direction }, radius, angle, z = 0) => [
  -direction * CURVE_RADIUS + direction * radius * Math.cos(angle),
  radius * Math.sin(angle),
  z,
];

const yawQuaternion = (yaw) => [Math.cos(yaw / 2), 0, 0, Math.sin(yaw / 2)];

const addVectors = (left, right) => left.map((value, index) => value + right[index]);
const scaleVector = (vector, scale) => vector.map((value) => value * scale);

const createAnnularPrismObj = ({
  name,
  turn,
  innerRadius,
  outerRadius,
  zBottom,
  zTop,
}) => {
  const vertices = [];
  const faces = [];
  for (let index = 0; index <= turn.meshSteps; index += 1) {
    const angle = (index / turn.meshSteps) * turn.angle;
    vertices.push(
      curvePoint(turn, innerRadius, angle, zBottom),
      curvePoint(turn, outerRadius, angle, zBottom),
      curvePoint(turn, innerRadius, angle, zTop),
      curvePoint(turn, outerRadius, angle, zTop)
    );
  }

  const addTriangle = (a, b, c) => {
    const indices = turn.direction > 0 ? [a, b, c] : [a, c, b];
    faces.push(`f ${indices.join(" ")}`);
  };
  const addQuad = (a, b, c, d) => {
    addTriangle(a, b, c);
    addTriangle(a, c, d);
  };

  for (let index = 0; index < turn.meshSteps; index += 1) {
    const current = index * 4 + 1;
    const next = current + 4;
    const [innerBottom, outerBottom, innerTop, outerTop] = [
      current,
      current + 1,
      current + 2,
      current + 3,
    ];
    const [nextInnerBottom, nextOuterBottom, nextInnerTop, nextOuterTop] = [
      next,
      next + 1,
      next + 2,
      next + 3,
    ];
    addQuad(innerTop, outerTop, nextOuterTop, nextInnerTop);
    addQuad(innerBottom, nextInnerBottom, nextOuterBottom, outerBottom);
    addQuad(innerBottom, innerTop, nextInnerTop, nextInnerBottom);
    addQuad(outerBottom, nextOuterBottom, nextOuterTop, outerTop);
  }

  const first = 1;
  const last = turn.meshSteps * 4 + 1;
  addQuad(first, first + 1, first + 3, first + 2);
  addQuad(last, last + 2, last + 3, last + 1);

  return [`o ${name}`, ...vertices.map((vertex) => `v ${formatVector(vertex)}`), ...faces, ""].join(
    "\n"
  );
};

const renderVisualModule = (moduleIndex, centerY, { includeEndFrame = true } = {}) => {
  const suffix = `module_${moduleIndex}`;
  const pos = `0 ${formatNumber(centerY)} 0`;
  const endFrame = includeEndFrame
    ? `      <geom name="conveyor_visual_0_${suffix}" type="mesh" mesh="conveyor_visual_0"
            pos="${pos}" material="conveyor_frame_mat" group="1"
            contype="0" conaffinity="0" density="0"/>
`
    : "";
  return `      <!-- Reusable polished 2.5 m visual module. -->
${endFrame}      <geom name="conveyor_visual_1_${suffix}" type="mesh" mesh="conveyor_visual_1"
            pos="${pos}" material="conveyor_frame_mat" group="1"
            contype="0" conaffinity="0" density="0"/>
      <geom name="conveyor_visual_2_${suffix}" type="mesh" mesh="conveyor_visual_2"
            pos="${pos}" material="conveyor_frame_mat" group="1"
            contype="0" conaffinity="0" density="0"/>
      <geom name="conveyor_visual_3_${suffix}" type="mesh" mesh="conveyor_visual_3"
            pos="${pos}" material="conveyor_frame_mat" group="1"
            contype="0" conaffinity="0" density="0"/>`;
};

const renderBeltVisual = () => `      <!-- One continuous belt skin hides the joins between frame modules. -->
      <geom name="conveyor_belt_visual" type="mesh" mesh="conveyor_belt_visual"
            material="conveyor_belt_mat" group="1"
            contype="0" conaffinity="0" density="0"/>`;

const renderStraightAttachmentSites = (length) => `      <!-- Connection frames share the +Y belt-travel axis for drag-to-attach placement. -->
      <site name="attachment_site" pos="0 ${formatNumber(-length / 2)} 0.88" zaxis="0 1 0"
            size="0.035" group="4"/>
      <site name="attachment_site_outlet" pos="0 ${formatNumber(length / 2)} 0.88" zaxis="0 1 0"
            size="0.035" group="4"/>`;

const renderCurveAttachmentSites = (turn) => {
  const exitPosition = curvePoint(turn, CURVE_RADIUS, turn.angle, 0.88);
  const exitDirection = [-turn.direction * Math.sin(turn.angle), Math.cos(turn.angle), 0];
  return `      <!-- Connection frames share the forward belt-travel axis for drag-to-attach placement. -->
      <site name="attachment_site" pos="0 0 0.88" zaxis="0 1 0" size="0.035" group="4"/>
      <site name="attachment_site_outlet" pos="${formatVector(exitPosition)}"
            zaxis="${formatVector(exitDirection)}" size="0.035" group="4"/>`;
};

const renderBeltSegment = (index, centerY, segmentCount) => {
  const isEndpoint = index === 0 || index === segmentCount - 1;
  const contactHalfLength =
    BELT_TILE_LENGTH / 2 + (isEndpoint ? BELT_WRAP_HALF_TRAVEL + HANDOFF_OVERLAP : 0);
  return `      <body name="conveyor_belt_segment_${index}" pos="0.0179964 ${formatNumber(centerY)} 0.88">
        <joint name="conveyor_belt_segment_${index}_slide" type="slide" axis="0 1 0"
               range="-${formatNumber(BELT_WRAP_HALF_TRAVEL)} ${formatNumber(BELT_WRAP_HALF_TRAVEL)}" limited="false" damping="0"/>
        <geom name="conveyor_belt_segment_${index}_contact" type="box" size="0.39 ${formatNumber(contactHalfLength)} 0.0125"
              mass="0.02" group="3" rgba="0 0 0 0" condim="6" friction="1.8 0.08 0.02"
              solimp="0.9 0.98 0.0001" solref="0.002 1"/>
      </body>`;
};

const renderEquality = (index) =>
  `    <joint name="belt_eq_${index}_${index + 1}" joint1="conveyor_belt_segment_${index}_slide" joint2="conveyor_belt_segment_${index + 1}_slide" polycoef="0 1 0 0 0"/>`;

const renderCurveSupportMesh = (turn) => {
  const angle = turn.angle / 2;
  const position = curvePoint(turn, CURVE_RADIUS, angle, 0);
  const quat = yawQuaternion(turn.direction * angle);
  return `      <!-- Reuse the straight conveyor's finished, adjustable-leg support assembly. -->
      <geom name="conveyor_curve_support_visual" type="mesh" mesh="conveyor_curve_support_visual"
            pos="${formatVector(position)}" quat="${formatVector(quat)}" material="conveyor_frame_mat"
            group="1" contype="0" conaffinity="0" density="0"/>`;
};

const renderCurveRailFastener = (turn, index, angle) => {
  const inner = curvePoint(turn, CURVE_RADIUS - 0.505, angle, 0.955);
  const outer = curvePoint(turn, CURVE_RADIUS + 0.505, angle, 0.955);
  return `      <geom name="conveyor_curve_inner_fastener_${index}" type="cylinder" pos="${formatVector(inner)}" size="0.022 0.008"
            material="conveyor_hardware_mat" group="1" contype="0" conaffinity="0" density="0"/>
      <geom name="conveyor_curve_outer_fastener_${index}" type="cylinder" pos="${formatVector(outer)}" size="0.022 0.008"
            material="conveyor_hardware_mat" group="1" contype="0" conaffinity="0" density="0"/>`;
};

const renderCurveEndRoller = (turn, name, center, tangent) => {
  const lateral = [tangent[1], -tangent[0], 0];
  const rollerStart = addVectors(center, scaleVector(lateral, -0.405));
  const rollerEnd = addVectors(center, scaleVector(lateral, 0.405));
  const capStart = addVectors(center, scaleVector(lateral, -0.455));
  const capEnd = addVectors(center, scaleVector(lateral, 0.455));
  return `      <!-- Driven roller and end caps make each curve interface read as a real conveyor transition. -->
      <geom name="conveyor_curve_${name}_roller" type="cylinder" fromto="${formatVector(rollerStart)} ${formatVector(rollerEnd)}" size="0.075"
            material="conveyor_hardware_mat" group="1" contype="0" conaffinity="0" density="0"/>
      <geom name="conveyor_curve_${name}_roller_caps" type="cylinder" fromto="${formatVector(capStart)} ${formatVector(capEnd)}" size="0.031"
            material="conveyor_frame_mat" group="1" contype="0" conaffinity="0" density="0"/>`;
};

const renderCurveFrameSection = (turn, index, angle, halfArcLength) => {
  const center = curvePoint(turn, CURVE_RADIUS, angle, 0.35);
  const innerRail = curvePoint(turn, CURVE_RADIUS - 0.51, angle, 0.82);
  const outerRail = curvePoint(turn, CURVE_RADIUS + 0.51, angle, 0.82);
  const quat = yawQuaternion(turn.direction * angle);
  return `      <geom name="conveyor_curve_frame_collision_${index}" type="box"
            pos="${formatVector(center)}" quat="${formatVector(quat)}"
            size="0.52 ${formatNumber(halfArcLength * 1.08)} 0.35" group="3" rgba="0 0 0 0"/>
      <geom name="conveyor_curve_inner_rail_collision_${index}" type="box"
            pos="${formatVector(innerRail)}" quat="${formatVector(quat)}"
            size="0.09 ${formatNumber(halfArcLength * 1.08)} 0.12" group="3" rgba="0 0 0 0"/>
      <geom name="conveyor_curve_outer_rail_collision_${index}" type="box"
            pos="${formatVector(outerRail)}" quat="${formatVector(quat)}"
            size="0.09 ${formatNumber(halfArcLength * 1.08)} 0.12" group="3" rgba="0 0 0 0"/>`;
};

const renderCurveBeltSegment = (turn, index, angle, halfArcLength) => {
  const position = curvePoint(turn, CURVE_RADIUS, angle, 0.88);
  const quat = yawQuaternion(turn.direction * angle);
  const isEndpoint = index === 0 || index === turn.segmentCount - 1;
  const contactHalfLength =
    halfArcLength * 1.08 + (isEndpoint ? BELT_WRAP_HALF_TRAVEL + HANDOFF_OVERLAP : 0);
  return `      <body name="conveyor_belt_segment_${index}" pos="${formatVector(position)}" quat="${formatVector(quat)}">
        <joint name="conveyor_belt_segment_${index}_slide" type="slide" axis="0 1 0"
               range="-${formatNumber(BELT_WRAP_HALF_TRAVEL)} ${formatNumber(BELT_WRAP_HALF_TRAVEL)}" limited="false" damping="0"/>
        <geom name="conveyor_belt_segment_${index}_contact" type="box"
              size="0.39 ${formatNumber(contactHalfLength)} 0.0125" mass="0.02" group="3"
              rgba="0 0 0 0" condim="6" friction="1.8 0.08 0.02"
              solimp="0.9 0.98 0.0001" solref="0.002 1"/>
      </body>`;
};

const renderVariant = ({ model, bodyName, moduleCount }) => {
  const length = moduleCount * MODULE_LENGTH;
  const segmentCount = Math.round(length / BELT_TILE_LENGTH);
  const longEndFrameMesh =
    moduleCount > 1
      ? '    <mesh name="conveyor_visual_0_long" file="visual_0-long.obj" inertia="shell"/>\n'
      : "";
  const longEndFrameVisual =
    moduleCount > 1
      ? `      <!-- A single scaled frame keeps end crossbars at the physical ends of the 5 m conveyor. -->
      <geom name="conveyor_visual_0_long" type="mesh" mesh="conveyor_visual_0_long"
            material="conveyor_frame_mat" group="1" contype="0" conaffinity="0" density="0"/>
`
      : "";
  const moduleCenters = Array.from(
    { length: moduleCount },
    (_, index) => -length / 2 + MODULE_LENGTH / 2 + index * MODULE_LENGTH
  );
  const segmentCenters = Array.from(
    { length: segmentCount },
    (_, index) => -length / 2 + BELT_TILE_LENGTH / 2 + index * BELT_TILE_LENGTH
  );

  return `<mujoco model="${model}">
  <!-- Generated by generate.mjs. Edit the generator rather than this file. -->
  <compiler angle="radian" meshdir="meshes" texturedir="textures"/>
  <option timestep="0.002"/>

  <asset>
    <material name="conveyor_frame_mat" rgba="0.48 0.52 0.58 1" metallic="0.72" roughness="0.28"/>
    <texture name="belt_color" type="2d" file="rubber-color.png"/>
    <texture name="belt_normal" type="2d" file="rubber-normal.png"/>
    <texture name="belt_roughness" type="2d" file="rubber-roughness.png"/>
    <material name="conveyor_belt_mat" rgba="1 1 1 1" metallic="0" roughness="1">
      <layer role="rgb" texture="belt_color"/>
      <layer role="normal" texture="belt_normal"/>
      <layer role="roughness" texture="belt_roughness"/>
    </material>
    <mesh name="conveyor_visual_0" file="visual_0.obj" inertia="shell"/>
${longEndFrameMesh}    <mesh name="conveyor_visual_1" file="visual_1.obj" inertia="shell"/>
    <mesh name="conveyor_visual_2" file="visual_2.obj" inertia="shell"/>
    <mesh name="conveyor_visual_3" file="visual_3.obj" inertia="shell"/>
    <mesh name="conveyor_belt_visual" file="${moduleCount > 1 ? "visual_4-long.obj" : "visual_4.obj"}" inertia="shell"/>
  </asset>

  <worldbody>
    <body name="${bodyName}" pos="0 0 0">
      <!-- Visual meshes never participate in collision. -->
${longEndFrameVisual}${moduleCenters
  .map((centerY, index) => renderVisualModule(index, centerY, { includeEndFrame: moduleCount === 1 }))
  .join("\n")}
${renderBeltVisual()}
${renderStraightAttachmentSites(length)}

      <!-- Stable primitive collision scales with the generated conveyor length. -->
      <geom name="conveyor_frame_collision" type="box"
            pos="0.0179964 0 0.3527419" size="0.5205209 ${formatNumber(length / 2)} 0.3527419"
            group="3" rgba="0 0 0 0"/>
      <geom name="conveyor_left_rail_collision" type="box"
            pos="-0.4912142 0 0.7242926" size="0.097543 ${formatNumber(length / 2)} 0.21227"
            group="3" rgba="0 0 0 0"/>
      <geom name="conveyor_right_rail_collision" type="box"
            pos="0.5092106 0 0.8212732" size="0.0795466 ${formatNumber(length / 2)} 0.1152895"
            group="3" rgba="0 0 0 0"/>

      <!-- Synchronized 0.5 m tiles form one continuous moving contact surface. -->
${segmentCenters
  .map((centerY, index) => renderBeltSegment(index, centerY, segmentCount))
  .join("\n")}
    </body>
  </worldbody>

  <equality>
${Array.from({ length: segmentCount - 1 }, (_, index) => renderEquality(index)).join("\n")}
  </equality>

  <actuator>
    <velocity name="conveyor_speed" joint="conveyor_belt_segment_0_slide" ctrlrange="-1.5 1.5" kv="20"/>
  </actuator>
</mujoco>
`;
};

const renderCurveVariant = (turn) => {
  const arcLength = CURVE_RADIUS * turn.angle;
  const halfArcLength = arcLength / turn.segmentCount / 2;
  const sectionAngles = Array.from(
    { length: turn.segmentCount },
    (_, index) => ((index + 0.5) / turn.segmentCount) * turn.angle
  );
  const meshPrefix = `curve-${turn.id}`;

  return `<mujoco model="${turn.model}">
  <!-- Generated by generate.mjs. Edit the generator rather than this file. -->
  <compiler angle="radian" meshdir="meshes" texturedir="textures"/>
  <option timestep="0.002"/>

  <asset>
    <material name="conveyor_frame_mat" rgba="0.48 0.52 0.58 1" metallic="0.72" roughness="0.28"/>
    <material name="conveyor_hardware_mat" rgba="0.16 0.18 0.22 1" metallic="0.82" roughness="0.24"/>
    <texture name="belt_color" type="2d" file="rubber-color.png"/>
    <texture name="belt_normal" type="2d" file="rubber-normal.png"/>
    <texture name="belt_roughness" type="2d" file="rubber-roughness.png"/>
    <material name="conveyor_belt_mat" rgba="1 1 1 1" metallic="0" roughness="1">
      <layer role="rgb" texture="belt_color"/>
      <layer role="normal" texture="belt_normal"/>
      <layer role="roughness" texture="belt_roughness"/>
    </material>
    <mesh name="conveyor_curve_belt_visual" file="${meshPrefix}-belt.obj" inertia="shell"/>
    <mesh name="conveyor_curve_inner_rail_visual" file="${meshPrefix}-inner-rail.obj" inertia="shell"/>
    <mesh name="conveyor_curve_outer_rail_visual" file="${meshPrefix}-outer-rail.obj" inertia="shell"/>
    <mesh name="conveyor_curve_support_visual"
          file="${turn.angle < Math.PI / 2 ? "curve-support-short.obj" : "visual_3.obj"}" inertia="shell"/>
  </asset>

  <worldbody>
    <body name="${turn.bodyName}" pos="0 0 0">
      <!-- The incoming connection is centered at the origin and points along local +Y. -->
      <geom name="conveyor_curve_belt_visual" type="mesh" mesh="conveyor_curve_belt_visual"
            material="conveyor_belt_mat" group="1" contype="0" conaffinity="0" density="0"/>
      <geom name="conveyor_curve_inner_rail_visual" type="mesh" mesh="conveyor_curve_inner_rail_visual"
            material="conveyor_frame_mat" group="1" contype="0" conaffinity="0" density="0"/>
      <geom name="conveyor_curve_outer_rail_visual" type="mesh" mesh="conveyor_curve_outer_rail_visual"
            material="conveyor_frame_mat" group="1" contype="0" conaffinity="0" density="0"/>
${renderCurveAttachmentSites(turn)}

${renderCurveEndRoller(turn, "inlet", [0, 0, 0.81], [0, 1, 0])}
${renderCurveEndRoller(
  turn,
  "outlet",
  curvePoint(turn, CURVE_RADIUS, turn.angle, 0.81),
  [-turn.direction * Math.sin(turn.angle), Math.cos(turn.angle), 0]
)}

${renderCurveSupportMesh(turn)}

      <!-- Fasteners along both guard rails give the curve the same manufactured detail as the straight modules. -->
${sectionAngles.map((angle, index) => renderCurveRailFastener(turn, index, angle)).join("\n")}

      <!-- Overlapping tangent boxes approximate stable curved frame and rail collision. -->
${sectionAngles
  .map((angle, index) => renderCurveFrameSection(turn, index, angle, halfArcLength))
  .join("\n")}

      <!-- Tangent-aligned moving contact tiles steer objects continuously through the turn. -->
${sectionAngles
  .map((angle, index) => renderCurveBeltSegment(turn, index, angle, halfArcLength))
  .join("\n")}
    </body>
  </worldbody>

  <equality>
${Array.from({ length: turn.segmentCount - 1 }, (_, index) => renderEquality(index)).join("\n")}
  </equality>

  <actuator>
    <velocity name="conveyor_speed" joint="conveyor_belt_segment_0_slide" ctrlrange="-1.5 1.5" kv="20"/>
  </actuator>
</mujoco>
`;
};

const outputDirectory = fileURLToPath(new URL(".", import.meta.url));
for (const variant of straightVariants) {
  writeFileSync(new URL(variant.filename, import.meta.url), renderVariant(variant), "utf8");
  console.log(`Generated ${variant.filename} in ${outputDirectory}`);
}

for (const turn of curveVariants) {
  writeFileSync(new URL(turn.filename, import.meta.url), renderCurveVariant(turn), "utf8");
  const meshDefinitions = [
    {
      filename: `curve-${turn.id}-belt.obj`,
      name: `conveyor_curve_${turn.id}_belt`,
      innerRadius: CURVE_RADIUS - 0.406,
      outerRadius: CURVE_RADIUS + 0.406,
      zBottom: 0.717,
      zTop: 0.892,
    },
    {
      filename: `curve-${turn.id}-inner-rail.obj`,
      name: `conveyor_curve_${turn.id}_inner_rail`,
      innerRadius: CURVE_RADIUS - 0.59,
      outerRadius: CURVE_RADIUS - 0.42,
      zBottom: 0.7,
      zTop: 0.94,
    },
    {
      filename: `curve-${turn.id}-outer-rail.obj`,
      name: `conveyor_curve_${turn.id}_outer_rail`,
      innerRadius: CURVE_RADIUS + 0.42,
      outerRadius: CURVE_RADIUS + 0.59,
      zBottom: 0.7,
      zTop: 0.94,
    },
  ];
  for (const mesh of meshDefinitions) {
    writeFileSync(
      new URL(`meshes/${mesh.filename}`, import.meta.url),
      createAnnularPrismObj({ ...mesh, turn }),
      "utf8"
    );
  }
  console.log(`Generated ${turn.filename} and curved meshes in ${outputDirectory}`);
}

// Rubber atlas covers one metre across and five metres along the belt.
// Map in metres so changing conveyor length never stretches the grip pattern.
function writeBeltUvs(filename, mapUv, output = filename, transformVertex = (vertex) => vertex) {
  const file = new URL('meshes/' + filename, import.meta.url);
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const vertices = lines
    .filter(line => line.startsWith('v '))
    .map(line => transformVertex(line.trim().split(/\s+/).slice(1).map(Number)));
  let vertexIndex = 0;
  const result = lines.filter(line => !line.startsWith('vt ')).map(line => {
    if (line.startsWith('v ')) return 'v ' + formatVector(vertices[vertexIndex++]);
    if (!line.startsWith('f ')) return line;
    return 'f ' + line.slice(2).trim().split(/\s+/).map(token => {
      const [v, , n] = token.split('/');
      return v + '/' + v + (n ? '/' + n : '');
    }).join(' ');
  });
  const firstFace = result.findIndex(line => line.startsWith('f '));
  result.splice(firstFace, 0, ...vertices.map(v => 'vt ' + mapUv(v).map(formatNumber).join(' ')));
  writeFileSync(new URL('meshes/' + output, import.meta.url), result.join('\n'));
}

function writeScaledMesh(filename, output, scale) {
  const file = new URL('meshes/' + filename, import.meta.url);
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const scaledLines = lines.map((line) => {
    const [kind, ...rawValues] = line.trim().split(/\s+/);
    if (kind === 'v') {
      return 'v ' + formatVector(rawValues.map(Number).map((value, index) => value * scale[index]));
    }
    if (kind === 'vn') {
      const normal = rawValues.map(Number).map((value, index) => value / scale[index]);
      const length = Math.hypot(...normal);
      return 'vn ' + formatVector(normal.map((value) => value / length));
    }
    return line;
  });
  writeFileSync(new URL('meshes/' + output, import.meta.url), scaledLines.join('\n'));
}

// The 45° curve needs the same finished support silhouette in a shorter footprint.
writeScaledMesh('visual_3.obj', 'curve-support-short.obj', [1, 0.6, 1]);
// The 5 m frame needs one extended end-frame mesh, not two 2.5 m end frames at the center join.
writeScaledMesh('visual_0.obj', 'visual_0-long.obj', [1, 2, 1]);
writeBeltUvs('visual_4.obj', ([x,y]) => [x + 0.5, (y + 1.25) / 5]);
writeBeltUvs(
  'visual_4.obj',
  ([x, y]) => [x + 0.5, (y + 2.5) / 5],
  'visual_4-long.obj',
  ([x, y, z]) => [x, y * 2, z]
);
for (const turn of curveVariants) {
  writeBeltUvs('curve-' + turn.id + '-belt.obj', ([x,y]) => {
    const radialX = turn.direction * x + CURVE_RADIUS;
    return [Math.hypot(radialX,y) - CURVE_RADIUS + 0.5, Math.atan2(y,radialX) * CURVE_RADIUS / 5];
  });
}
