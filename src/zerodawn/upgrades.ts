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
];