/**
 * Upgrade list!
 */
import type {State} from './index';

type Data = typeof import('./index').GameData;
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
        name: "Scarab armor upgrade",
        desc: "Scarab armor doubled. Costs 100 materials and 200 power.",
        price: {materials: 100, energy: 200},
        onStartup: (state, data) => {
            data.VALUES.scarab.defense *= 2;
            return;
        },
    },
    {
        name: "Autonomous Creation",
        desc: (
            "50% chance for a Horus to make a Khopesh or Scarab every 10 seconds, " +
            "if materials are available. Costs 500 energy and 500 materials."
        ),
        price: {materials: 500, energy: 500},
        canPurchase: state => state.materials >= 500 && state.power > 500,
        onLoop: (state, data, app) => {
            if (!state.upgradeState.ticks) state.upgradeState.ticks = 0;
            state.upgradeState.ticks++;
            const requiredTicks = state.upgrades?.includes("Faster Autonomous Creation") ? 5 : 10;
            if (state.upgradeState.ticks % requiredTicks === 0 && Math.random() > 0.5) {
                const times = state.upgrades?.includes('Autonomous Creation+') ? 2 : 1;
                for (let i = 0; i < times; i++) {
                    let machine = Math.random() > 0.5 ? 'scarab' : 'khopesh';
                    if (state.upgrades?.includes("Horus Creation")) {
                        if (Math.random() > 0.95) {
                            machine = 'horus';
                        }
                    }
                    app.tryPurchase(machine);
                }
            }
        }
    },
    {
        name: "Horus Creation",
        desc: "Gives Autonomous Creation a 5% chance to create a Horus. Costs: 1000 power and 1000 materials.",
        requires: ['Autonomous Creation'],
        price: {materials: 1000, energy: 1000, showDiff: 250},
    },
    {
        name: "Faster Autonomous Creation",
        desc: "Autonomous Creation runs every 5 seconds instead of every 10. Costs: 1500 power and 1500 materials.",
        requires: ['Autonomous Creation'],
        price: {materials: 1500, energy: 1500},
    },
    {
        name: "Scarab Hunger+",
        desc: "Scarabs collect twice as much material and 1.5 as much power. Costs 500 material and 500 energy.",
        price: {materials: 500, energy: 500},
        onStartup: (state, data) => {
            data.VALUES.scarab.collectionRate = 0.2;
            data.VALUES.scarab.consumeOutput *= 1.5
        },
    },
    {
        name: "Scarab Hunger++",
        desc: "Scarabs collect twice as much material and 1.5 as much power. Costs 1000 material and 1000 energy.",
        price: {materials: 1000, energy: 1000},
        onStartup: (state, data) => {
            data.VALUES.scarab.collectionRate = 0.2;
            data.VALUES.scarab.consumeOutput *= 1.5
        },
    },
    {
        name: "Autonomous Creation+",
        desc: "Autonomous Creation creates two machines every time it runs, Costs 2000 materials and 2000 energy.",
        requires: ['Autonomous Creation'],
        price: {materials: 2000, energy: 2000, showDiff: 500},
    },
];