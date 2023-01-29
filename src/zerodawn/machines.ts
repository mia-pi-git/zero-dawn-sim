/**
 * All machine data lives here.
 */
import type {State} from './index';

export type MachineType = 'acquisition' | 'combat' | 'recon' | 'transport';

export interface BasicMachine {
    name: string;
    cost: {energy: number, materials: number};
    /** Seconds */
    creationTime: number;
    type: MachineType;
    powerConsumption: number;
    defense: number;
    purchaseUnlocked?: (state: State) => boolean;
}

/**
 * Template:
cost: {power: 0, materials: 0},
creationTime: 0,
powerConsumption: 0,
defense: 0,
 */

export type Machine = BasicMachine & ({
    type: 'combat',
    attackPower: number;
    combatPowerConsumption: number;
} | {
    type: 'acquisition',
    outputRate: {power: number, materials: number},
    restoreRate: number;
} | {
    // recon temporarily buffs acquisition by finding new materials
    type: 'recon',
    locationChance: number;
    buffDuration: number;
    buffMultiplier: number;
    buffRange: number;
} | {
    type: 'transport',
    carryingCapacity: number;
    transportSpeed: number;
})

export const machines: Record<string, Machine> = {
    // ------ ACQUISITION
    grazer: {
        name: "Grazer",
        type: 'acquisition',
        cost: {energy: 10, materials: 10},
        creationTime: 1,
        powerConsumption: 0.1,
        defense: 2,
        outputRate: {power: 0.15, materials: 0.1},
        restoreRate: 0.25,
    },

    lancehorn: {
        name: "Lancehorn",
        type: 'acquisition',
        cost: {energy: 10, materials: 10},
        creationTime: 1,
        powerConsumption: 0.15,
        defense: 3,
        outputRate: {power: 0.1, materials: 0.1},
        restoreRate: 0.27,
    },

    spikesnout: {
        name: "Spikesnout",
        type: 'acquisition',
        cost: {energy: 15, materials: 15},
        creationTime: 1.5,
        powerConsumption: 0.24,
        defense: 1,
        outputRate: {power: 0.25, materials: 0.15},
        restoreRate: 0.3,
    },

    plowhorn: {
        name: "Plowhorn",
        type: 'acquisition',
        cost: {energy: 45, materials: 45},
        creationTime: 3,
        powerConsumption: 0.5,
        defense: 2,
        outputRate: {power: 0.35, materials: 0.35},
        restoreRate: 0.65,
    },

    bristleback: {
        name: "Bristleback",
        type: 'acquisition',
        cost: {energy: 20, materials: 20},
        creationTime: 3,
        powerConsumption: 0.3,
        defense: 1,
        outputRate: {power: 0.1, materials: 0.3},
        restoreRate: 0.3,
    },

    fanghorn: {
        name: "Fanghorn",
        type: 'acquisition',
        cost: {energy: 10, materials: 10},
        creationTime: 2,
        powerConsumption: 0.1,
        defense: 1,
        outputRate: {power: 0.15, materials: 0.15},
        restoreRate: 0.15,
    },

    widemaw: {
        name: "Widemaw",
        type: 'acquisition',
        cost: {energy: 35, materials: 35},
        creationTime: 3,
        powerConsumption: 0.3,
        defense: 3,
        outputRate: {power: 0.2, materials: 0.1},
        restoreRate: 0.4,
    },

    clamberjaw: {
        name: "Clamberjaw",
        type: 'acquisition',
        cost: {energy: 25, materials: 18},
        creationTime: 3,
        powerConsumption: 0.3,
        defense: 3,
        outputRate: {power: 0.3, materials: 0.05},
        restoreRate: 0.2,
    },

    sunwing: {
        name: "Sunwing",
        type: 'acquisition',
        cost: {energy: 40, materials: 40},
        creationTime: 5,
        powerConsumption: 0.07,
        defense: 6,
        outputRate: {power: 0.6, materials: 0.0},
        restoreRate: 0.15,
    },

    tideripper: {
        name: "Tideripper",
        type: 'acquisition',
        cost: {energy: 75, materials: 75},
        creationTime: 7,
        powerConsumption: 0.75,
        defense: 10,
        outputRate: {power: 0.0, materials: 0.75},
        restoreRate: 0.75,
    },

    fireclaw: {
        name: "Fireclaw",
        type: 'acquisition',
        cost: {energy: 75, materials: 85},
        creationTime: 7,
        powerConsumption: 0.85,
        defense: 15,
        outputRate: {power: 0.1, materials: 0.8},
        restoreRate: 0.0,
    },

    frostclaw: {
        name: "Frostclaw",
        type: 'acquisition',
        cost: {energy: 75, materials: 85},
        creationTime: 7,
        powerConsumption: 0.85,
        defense: 15,
        outputRate: {power: 0.1, materials: 0.8},
        restoreRate: 0.0,
    },

    charger: {
        name: "Charger",
        type: 'acquisition',
        cost: {energy: 10, materials: 10},
        creationTime: 2,
        powerConsumption: 0.2,
        defense: 2,
        outputRate: {power: 0.35, materials: 0.05},
        restoreRate: 0.05,
    },

    scrapper: {
        name: "Scrapper",
        type: 'acquisition',
        cost: {energy: 5, materials: 5},
        creationTime: 1,
        powerConsumption: 0.15,
        defense: 1,
        outputRate: {materials: 0.2, power: 0.01},
        restoreRate: 0.05,
    },

    glinthawk: {
        name: "Glinthawk",
        type: 'acquisition',
        cost: {energy: 5, materials: 15},
        creationTime: 1,
        powerConsumption: 0.2,
        defense: 5,
        outputRate: {materials: 0.28, power: 0.01},
        restoreRate: 0.05,
    },

    snapmaw: {
        name: "Snapmaw",
        type: 'acquisition',
        cost: {energy: 50, materials: 65},
        creationTime: 6,
        powerConsumption: 0.56,
        defense: 7,
        outputRate: {power: 0.1, materials: 0.65},
        restoreRate: 0.25,
    },

    rockbreaker: {
        name: "Rockbreaker",
        type: 'acquisition',
        cost: {energy: 95, materials: 120},
        creationTime: 1,
        powerConsumption: 0.9,
        defense: 10,
        outputRate: {power: 0.1, materials: 0.95},
        restoreRate: 0.25,
    },

    // ------- RECON
    watcher: {
        name: "Watcher",
        type: 'recon',
        cost: {energy: 10, materials: 10},
        creationTime: 1,
        powerConsumption: 0.15,
        defense: 1,
        locationChance: 0.75,
        buffDuration: 2,
        buffMultiplier: 1.05,
        buffRange: 3,
    },

    burrower: {
        name: "Burrower",
        type: 'recon',
        cost: {energy: 10, materials: 10},
        creationTime: 1,
        powerConsumption: 0.15,
        defense: 2,
        locationChance: 0.75,
        buffDuration: 2,
        buffMultiplier: 1.1,
        buffRange: 3,
    },

    skydrifter: {
        name: "Skydrifter",
        type: 'recon',
        cost: {energy: 20, materials: 20},
        creationTime: 3.5,
        powerConsumption: 0.50,
        defense: 2,
        locationChance: 0.75,
        buffDuration: 4,
        buffMultiplier: 1.2,
        buffRange: 6,
    },

    longleg: {
        name: "Longleg",
        type: 'recon',
        cost: {energy: 25, materials: 30},
        creationTime: 4,
        powerConsumption: 0.75,
        defense: 4,
        locationChance: 0.9,
        buffDuration: 4,
        buffMultiplier: 1.5,
        buffRange: 5,
    },

    tallneck: {
        name: "Tallneck",
        type: 'recon',
        cost: {energy: 1000, materials: 1000},
        creationTime: 20,
        powerConsumption: 1.25,
        defense: 20,
        locationChance: 0.9,
        buffDuration: 2,
        buffMultiplier: 2,
        buffRange: 15,
    },

    // ------ TRANSPORT
    leaplasher: {
        name: "Leaplasher",
        type: 'transport',
        cost: {energy: 10, materials: 10},
        creationTime: 1,
        powerConsumption: 0.15,
        defense: 1.5,
        carryingCapacity: 5,
        transportSpeed: 5,
    },

    rollerback: {
        name: "Rollerback",
        type: 'transport',
        cost: {energy: 30, materials: 30},
        creationTime: 2,
        powerConsumption: 0.5,
        defense: 2.5,
        carryingCapacity: 20,
        transportSpeed: 5,
    },

    bellowback: {
        name: "Bellowback",
        type: 'transport',
        cost: {energy: 40, materials: 40},
        creationTime: 3.5,
        powerConsumption: 1,
        defense: 2,
        carryingCapacity: 40,
        transportSpeed: 7,
    },

    shellwalker: {
        name: "Shell-Walker",
        type: 'transport',
        cost: {energy: 50, materials: 30},
        creationTime: 3.5,
        powerConsumption: 1,
        defense: 6,
        carryingCapacity: 30,
        transportSpeed: 6,
    },

    behemoth: {
        name: "Behemoth",
        type: 'transport',
        cost: {energy: 60, materials: 70},
        creationTime: 5,
        powerConsumption: 1.5,
        defense: 6,
        carryingCapacity: 100,
        transportSpeed: 7,
    },

    // ------ COMBAT
    clawstrider: {
        name: "Clawstrider",
        type: 'combat',
        cost: {energy: 15, materials: 15},
        creationTime: 5,
        powerConsumption: 1,
        defense: 2,
        attackPower: 3,
        combatPowerConsumption: 1,
    },
};

export const cauldronUnlocks: Record<string, string[]> = {
    Alpha: [
        'Grazer', 'Watcher', 'Leaplasher',
    ],
    Beta: [
        'Lancehorn', 'Fanghorn', 'Charger', 'Rollerback',
    ],
    Gamma: [
        'Spikesnout', 'Glinthawk', 'Shell-Walker', 'Burrower',
    ],
    Delta: [
        'Bristleback', 'Bellowback', 'Skydrifter',
    ],
    Epsilon: [
        'Clamberjaw', 'Widemaw',
    ],
    Zeta: [
        'Sunwing', 'Plowhorn', 'Behemoth',
    ],
    Eta: [
        "Snapmaw", 'Longleg',
    ],
    Theta: [
        'Tallneck',
    ],
    Iota: [
        'Fireclaw', 'Frostclaw',
    ],
    Kappa: [
        "Tideripper", "Rockbreaker",
    ],
    Lambda: [],
    Mu: [],
    Nu: [],
    Xi: [],
    Omicron: [],
    Pi: [],
    Rho: [],
    Sigma: [],
    Tau: [],
    Upsilon: [],
    Phi: [],
    Chi: [],
    Psi: [],
    Omega: []
};

export const tasks: Record<MachineType, string[]> = {
    acquisition: ['collecting', 'terraforming'],
    combat: ['defense'],
    recon: ['recon'],
    transport: ['transport'],
};