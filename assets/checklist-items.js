// =====================================================================
// Fleet Hub — Checklist questions
// Mirrors the JDL Contractors Ltd paper "Vehicle Safety Check Sheet"
// =====================================================================

const CHECKLIST_EXTERNAL = [
  { id: "engine_oil", q: "Engine oil level correct?" },
  { id: "coolant_level", q: "Coolant level correct?" },
  { id: "washer_fluid", q: "Washer fluid full?" },
  { id: "adblue_mileage", q: "AdBlue mileage OK? (if applicable)" },
  { id: "windscreen", q: "Windscreen free from cracks / chips?" },
  { id: "wipers", q: "Do wipers clear the windscreen efficiently?" },
  { id: "mirrors", q: "Mirrors intact & functional?" },
  { id: "indicators", q: "Indicators operating?" },
  { id: "external_lights", q: "External lights working — dipped beam, high beam, daytime running lights, brake lights, reverse lights, rear fog lights?" },
  { id: "physical_damage", q: "No physical damage to panels, doors, lights, tail lifts or cages, and the vehicle is clean?" },
  { id: "tyres", q: "Tyres have tread over the complete surface and are not near / on the wear bars?" },
];

const CHECKLIST_INTERNAL = [
  { id: "gauges", q: "Do all gauges work correctly when the vehicle is started?" },
  { id: "warning_lights", q: "Are there any warning lights on the dashboard?", invert: true },
  { id: "seat_covers_condition", q: "Are seat covers / floor mats in good condition?" },
  { id: "horn", q: "Does the horn work?" },
  { id: "handbrake", q: "Does the handbrake hold the vehicle on a steep hill?" },
  { id: "noises", q: "Are there any unusual noises whilst driving?", invert: true },
  { id: "disc_lock", q: "Disc lock / stop lock functional?" },
];

// Note: items with `invert: true` are phrased so that "Yes" is the
// problem (e.g. "are there any warning lights") — these are flagged as
// a defect when answered "Yes" instead of "No".
