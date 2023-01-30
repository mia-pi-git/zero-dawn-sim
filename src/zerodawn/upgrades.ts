/**
 * Upgrade list!
 */
import type {State} from './index';

type Data = typeof import('./index').GameData;

export const MAX_LAND = 148940000;
export interface Upgrade {
    name: string;
    desc: string;
    requires?: string[];
    price?: {materials: number, energy: number, showDiff?: number};
    canPurchase?: (state: State) => boolean;
    onPurchase?: (state: State) => void;
    shouldDisplay?: (state: State) => boolean;
    onStartup?: (state: State, data: Data) => void;
    onBattle?: (state: State) => void;
    onLoop?: (state: State, data: Data, app: import('./index').App) => void;
}

export const upgrades: Upgrade[] = [
    {
        name: "Solar Arrays",
        desc: "Add solar power arrays near Cauldrons. +1 power per second per Cauldron.",
        price: {materials: 50, energy: 50, showDiff: 10},
    },
    {
        name: "Cauldron Capacity+",
        desc: "Allow each Cauldron to make two machines at a time.",
        price: {materials: 200, energy: 200, showDiff: 50},
        onPurchase: state => {
            for (const c of state.cauldrons) {
                c.capacity = 2;
            }
            state.newCauldronCapacity = 2;
        },
    },
    {
        name: "Cauldron Capacity++",
        desc: "Allow each Cauldron to make three machines at a time.",
        price: {materials: 600, energy: 600, showDiff: 100},
        requires: ['Cauldron Capacity+'],
        onPurchase: state => {
            for (const c of state.cauldrons) {
                c.capacity = 3;
            }
            state.newCauldronCapacity = 3;
        },
    },
    {
        name: "Cauldron Capacity+++",
        desc: "Allow each Cauldron to make four machines at a time.",
        price: {materials: 1000, energy: 1000, showDiff: 100},
        requires: ['Cauldron Capacity++'],
        onPurchase: state => {
            for (const c of state.cauldrons) {
                c.capacity = 4;
            }
            state.newCauldronCapacity = 4;
        },
    },
    {
        name: "Cauldron Capacity++++",
        desc: "Allow each Cauldron to make five machines at a time.",
        price: {materials: 1000, energy: 1000, showDiff: 100},
        requires: ['Cauldron Capacity+++'],
        onPurchase: state => {
            for (const c of state.cauldrons) {
                c.capacity = 5;
            }
            state.newCauldronCapacity = 5;
        },
    },

    {
        name: "More Efficient Harvesting",
        desc: "Use 10% less terraformed land when harvesting power/materials.",
        price: {materials: 800, energy: 800, showDiff: 200},
        onPurchase: state => {
            state.landUseRate = 2.2;
        },
    },
    {
        name: "More Efficient Harvesting+",
        desc: "Use 20% less terraformed land when harvesting power/materials.",
        price: {materials: 1400, energy: 1400, showDiff: 200},
        requires: ['More Efficient Harvesting'],
        onPurchase: state => {
            state.landUseRate = 2.45;
        },
    },

    {
        name: "Faster Cauldrons",
        desc: "Reduce machine creation time by 10%.",
        price: {materials: 500, energy: 500, showDiff: 150},
        onStartup: (state, data) => {
            for (const k in data.MACHINES) {
                const m = data.MACHINES[k];
                m.creationTime -= (0.10 * m.creationTime);
            }
        },
    },

    {
        name: "Faster Cauldrons+",
        desc: "Reduce machine creation time by 10%.",
        price: {materials: 1500, energy: 1500, showDiff: 150},
        requires: ['Faster Cauldrons'],
        onStartup: (state, data) => {
            for (const k in data.MACHINES) {
                const m = data.MACHINES[k];
                m.creationTime -= (0.10 * m.creationTime);
            }
        },
    },

    {
        name: "Humans!",
        desc: (
            "You've fully terraformed the Earth! " + 
            "Open the Cradles, and release humanity back into the world. " + 
            "Note that terraformed land will start to decay if not maintained."
        ),
        canPurchase: state => state.landRestored >= MAX_LAND,
        shouldDisplay: state => state.landRestored >= 100000000,
        onPurchase: state => {
            state.villages = new Array(9).fill(500);
            state.humans = 9 * 500;
        }
    },
];