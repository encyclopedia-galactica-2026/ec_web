export interface Exoplanet {
  name: string;
  distance: number;
  type: string;
  description: string;
}

export const EXOPLANETS: Exoplanet[] = [
  { name: "Proxima Centauri b", distance: 4.24, type: "Rocky", description: "Closest known exoplanet to our Solar System" },
  { name: "TRAPPIST-1e", distance: 39.6, type: "Rocky", description: "Potentially habitable world in a seven-planet system" },
  { name: "TRAPPIST-1f", distance: 39.6, type: "Rocky", description: "Icy world receiving similar light to Mars" },
  { name: "Kepler-442b", distance: 1206, type: "Super-Earth", description: "One of the most Earth-like planets discovered" },
  { name: "Kepler-186f", distance: 582, type: "Rocky", description: "First Earth-sized planet found in a habitable zone" },
  { name: "Kepler-22b", distance: 638, type: "Super-Earth", description: "First confirmed planet in a Sun-like star's habitable zone" },
  { name: "LHS 1140 b", distance: 41, type: "Super-Earth", description: "Dense rocky world orbiting a quiet red dwarf" },
  { name: "TOI-700 d", distance: 101.4, type: "Rocky", description: "Earth-sized planet in the habitable zone of a cool star" },
  { name: "Gliese 667 Cc", distance: 23.6, type: "Super-Earth", description: "Warm super-Earth in a triple-star system" },
  { name: "Ross 128 b", distance: 11, type: "Rocky", description: "Temperate planet around a quiet nearby star" },
  { name: "K2-18 b", distance: 124, type: "Sub-Neptune", description: "First exoplanet with water vapor detected in its atmosphere" },
  { name: "HD 40307 g", distance: 42, type: "Super-Earth", description: "Long-period super-Earth in the habitable zone" },
  { name: "Wolf 1061 c", distance: 13.8, type: "Super-Earth", description: "Rocky planet near the inner edge of habitability" },
  { name: "Tau Ceti e", distance: 11.9, type: "Super-Earth", description: "Candidate habitable world around a Sun-like star" },
  { name: "Teegarden's Star b", distance: 12.5, type: "Rocky", description: "Closest potentially habitable Earth-mass planet" },
  { name: "GJ 357 d", distance: 31, type: "Super-Earth", description: "Super-Earth at the outer edge of the habitable zone" },
  { name: "Kepler-452b", distance: 1402, type: "Super-Earth", description: "Older cousin of Earth orbiting a Sun-like star" },
  { name: "Kepler-62f", distance: 1200, type: "Super-Earth", description: "Cold super-Earth that may have a thick atmosphere" },
  { name: "LP 890-9 c", distance: 105, type: "Rocky", description: "Second-most habitable exoplanet known" },
  { name: "GJ 1002 b", distance: 15.8, type: "Rocky", description: "Earth-mass planet around one of the closest red dwarfs" },
];

export function filterExoplanets(query: string): Exoplanet[] {
  if (!query.trim()) return EXOPLANETS;
  const q = query.toLowerCase();
  return EXOPLANETS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}
