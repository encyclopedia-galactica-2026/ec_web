export interface ExoplanetRecord {
    name: string;
    radius_earth: number;   // R⊕
    mass_earth: number;     // M⊕
    equilibrium_temp_k: number; // Kelvin
}

export const SEEDING_EXOPLANETS: ExoplanetRecord[] = [
    { name: "Proxima Cen b", radius_earth: 1.07, mass_earth: 1.05, equilibrium_temp_k: 218 },
    { name: "Kepler-1512 b", radius_earth: 1.18, mass_earth: 1.76, equilibrium_temp_k: 322 },
    { name: "G 261-6 b", radius_earth: 1.10, mass_earth: 1.37, equilibrium_temp_k: 322 },
    { name: "LP 791-18 d", radius_earth: 1.03, mass_earth: 0.90, equilibrium_temp_k: 396 },
    { name: "YZ Cet c", radius_earth: 1.05, mass_earth: 1.14, equilibrium_temp_k: 410 },
    { name: "TRAPPIST-1 g", radius_earth: 1.13, mass_earth: 1.32, equilibrium_temp_k: 197 },
];

export function getExoplanet(name: string): ExoplanetRecord | undefined {
    return SEEDING_EXOPLANETS.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
    );
}

export function getAllExoplanetNames(): string[] {
    return SEEDING_EXOPLANETS.map((p) => p.name);
}
