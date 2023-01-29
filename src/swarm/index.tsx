/**
 * Main game files.
 */
import {Upgrade, upgrades} from './upgrades.js';
declare const React: typeof window.React;

type Task = 'constructing' | 'consuming' | 'fighting' | 'prepped';
export type State = typeof GameData.DEFAULT_STATE;
type CostData = {
    materials: number,
    energy: number,
    constructionTime: number;
};

interface ValueData {
    forceProjection: number;
    defense: number;
    consumeOutput: number;
    powerUse: Record<Task, number>;
    collectionRate?: number;
}

export const GameData = new class {
    readonly MAX_CONSUMPTION = 100_000_000_000_000;
    readonly NAMES: Record<string, string> = {
        horus: "BOR-7 Horus",
        khopesh: "FSP5 Khopesh",
        scarab: "ACA3 Scarab",
    };
    readonly COSTS: Record<string, CostData> = {
        horus: {materials: 200, energy: 150, constructionTime: 10},
        khopesh: {materials: 20, energy: 10, constructionTime: 3},
        scarab: {materials: 10, energy: 5, constructionTime: 2},
    };
    readonly VALUES: Record<string, ValueData> = {
        horus: {
            forceProjection: 35,
            defense: 20,
            consumeOutput: 0,
            powerUse: {
                consuming: 0,
                constructing: 1.5,
                fighting: 2,
                // lying in wait takes no power
                prepped: 0,
            }
        },
        khopesh: {
            forceProjection: 7,
            defense: 3,
            consumeOutput: 0.1,
            powerUse: {
                consuming: 0.3,
                fighting: 1,
                // cannot construct
                constructing: 0,
                prepped: 0,
            },
        },
        scarab: {
            forceProjection: 1,
            defense: 2,
            consumeOutput: 0.25,
            powerUse: {
                consuming: 0.05,
                fighting: 0.5,
                constructing: 0,
                prepped: 0,
            },
            collectionRate: 0.1,
        },
    }

    readonly DEFAULT_STATE = {
        battle: {last: 0, waiting: 0, force: 0, result: null as any},
        materials: 100,
        totalHarvest: 0,
        power: 100,
        noticed: false,
        busy: {
            horus: [],
            khopesh: [],
            scarab: [],
        } as Record<string, Task[]>,
        machines: {
            horus: 1,
            khopesh: 0,
            scarab: 0,
        } as Record<string, number>,
        constructing: {} as Record<string, number[]>,
        upgrades: null as null | string[],
        upgradeState: {} as any,
    }

    getState(): State {
        try {
            const val = localStorage.getItem('state-' + document.title);
            if (!val) throw new Error();
            const state = Object.assign(this.DEFAULT_STATE, JSON.parse(val));
            if (state.upgrades) {
                for (const u of state.upgrades) {
                    const upgrade = upgrades.find(f => f.name === u);
                    if (upgrade) {
                        upgrade.onStartup?.(state, GameData);
                    }
                }
            }
        } catch {}
        return this.DEFAULT_STATE;
    }
};

export class Space extends React.Component {
    render() {
        return <span dangerouslySetInnerHTML={{__html: '&nbsp;'}}></span>;
    }
}

// I KNOW I'M USING REACT ALL WRONG BUT I LIKE IT LIKE THIS
export const Manager = new class {
    panel!: App;
    timer: NodeJS.Timer;
    constructor() {
        this.timer = setInterval(() => {
            this.panel?.tick();
        }, 1000);
    }

    use(panel: App) {
        this.panel = panel;
    }
}

export const state = GameData.getState();

export class App extends React.Component {
    state = state;
    constructor(props: any) {
        super(props);
        Manager.use(this);
    }

    canPurchase(machine: string) {
        const cost = GameData.COSTS[machine];
        return (
            this.state.materials >= cost.materials &&
            this.state.power >= cost.energy && 
            // you need a horus free to make other machines
            (!this.state.busy.horus || (this.state.busy.horus.length < this.state.machines.horus))
        );
    }

    tryPurchase(machine: string) {
        if (!this.canPurchase(machine)) return false;
        const cost = GameData.COSTS[machine];
        this.state.power -= cost.energy;
        this.state.materials -= cost.materials;
        (this.state.constructing[machine] ||= []).push(Date.now()); 
        this.state.busy.horus.push('constructing');

        this.forceUpdate();
    }

    tick() {
        if (!this.state.machines.horus) {
            alert([
                "You've lost all your Horuses!",
                " You can't produce more machines, so you've lost :(",
                "Refresh the page to start again.",
            ].join('\n'));
            clearInterval(Manager.timer);
            localStorage.removeItem('state');
            return;
        }
        for (const machine of ['khopesh', 'scarab']) {
            const collecting = this.state.busy[machine].filter(f => f === 'consuming');
            if (collecting.length > 0) {
                const vals = GameData.VALUES[machine];
                const startP = this.state.power;
                this.state.power += (collecting.length * vals.consumeOutput);
                this.state.power -= (collecting.length * vals.powerUse.consuming);
                this.state.totalHarvest += (this.state.power - startP);
                if (machine === 'scarab') { // 1 material per 10 seconds per scarab
                    const valRate = GameData.VALUES.scarab.collectionRate || 0.1;
                    this.state.materials += (collecting.length * valRate);
                }
            }
        }

        const constructing = Object.entries(this.state.constructing)
            .filter(f => f[1].length)

        if (constructing.length) {
            for (const [id, dates] of constructing) {
                const timeRequired = GameData.COSTS[id].constructionTime;
                const duration = timeRequired * 60 * 1000;
                for (const [i, date] of dates.entries()) {
                    if ((date + duration) > Date.now()) {
                        this.state.machines[id]++;
                        dates.splice(i, 1);
                        const z = this.state.busy.horus.indexOf('constructing');
                        this.state.busy.horus.splice(z, 1);
                        if (id === 'horus' && this.state.machines.horus > 1) {
                            this.state.noticed = true;
                        }
                    }
                }
            }
        }
        for (const u of (this.state.upgrades ||= [])) {
            const upgrade = upgrades.find(z => z.name === u);
            upgrade?.onLoop?.(state, GameData, this);
        }

        this.save();
        this.forceUpdate();
    }

    machineButton(k: string) {
        return <>
            {GameData.NAMES[k]}: {this.state.machines[k]}<Space />
            <button 
                disabled={!this.canPurchase(k)} 
                onClick={() => this.tryPurchase(k)}
            >+</button><br />
        </>   
    }
    allocateButtons(machine: string) {
        const canAllocate = this.state.machines[machine] > this.state.busy[machine].length;
        const canDeallocate = this.state.busy[machine].filter(f => f === 'consuming');
        return <>
            {GameData.NAMES[machine]} ({canDeallocate.length}):<Space />
            <button disabled={!canAllocate} onClick={() => this.setBusy(machine, 'consuming')}> + </button> 
            <button disabled={!canDeallocate.length} onClick={() => this.removeBusy(machine, 'consuming')}> - </button> 
            <br />
        </>
    }

    setBusy(machine: string, task: Task) {
        if (this.state.machines[machine] > this.state.busy[machine].length) {
            this.state.busy[machine].push(task);
            this.forceUpdate();
        }
    }

    removeBusy(machine: string, task: Task) {
        const idx = this.state.busy[machine].indexOf(task);
        if (idx > -1) {
            this.state.busy[machine].splice(idx, 1);
            this.forceUpdate();
        }
    }
    countBusy(machine: string, state: Task) {
        return this.state.busy[machine].filter(f => f === state).length;
    }

    warButtons(machine: string) {
        const canPrep = this.state.busy[machine].length < this.state.machines[machine];
        const canUnprep = this.state.busy[machine].filter(f => f === 'prepped').length;
        return <>
            {GameData.NAMES[machine]} ({this.countBusy(machine, 'prepped')}):<Space />
            <button disabled={!canPrep} onClick={() => this.setBusy(machine, 'prepped')}> + </button> 
            <button disabled={!canUnprep} onClick={() => this.removeBusy(machine, 'prepped')}> - </button>
            <br />
        </>
    }

    generateAttack() {
        delete this.state.battle.result;

        this.state.battle.waiting = Date.now();
        let total = 0;
        // match every 2 scarabs with a unit
        // match every khopesh
        // every horus with 20 
        total += (this.state.machines.horus * 20);
        total += this.state.machines.khopesh;
        total += Math.round(this.state.machines.scarabs / 2) || 1;
        total += Math.round(Math.random() * total) || 0;

        this.state.battle.force = total;
        this.save();
        return total;
    }

    // entirely separate since it's empty until a certain point
    renderWarPanel() {
        const machines = this.state.machines;
        if (!this.state.noticed && (!(machines.horus > 1 || machines.khopesh > 10))) {
            return <>
                Operation: Enduring Victory has not begun. 
                Their lack of control over you has not yet been noticed by humanity.
            </>
        }
        const battleAvailable = (
            this.state.battle.waiting || 
            !this.state.battle.last || 
            ((Date.now() - this.state.battle.last) >= (2 * 60 * 1000))
        );
        if (!battleAvailable) {
            if (this.state.battle.result) {
                return this.renderBattleResult();
            }
            return <>No battles available.</>
        }
        delete this.state.battle.result;
        const BATTLE_WAIT = 2 * 60 * 1000;
        if (!this.state.battle.waiting) {
            this.generateAttack();
            // ignored it for too long, force an attack
        } else if ((Date.now() - this.state.battle.waiting) >= BATTLE_WAIT) {
            return this.runBattle();
        }

        const timeUntilBattle = (this.state.battle.waiting + BATTLE_WAIT) - Date.now();
        
        return <>
            Prepare for battle! 
            You have an opportunity to strike at an approaching Enduring Victory task force!<br />
            Unless you attack soon, they will reach your main swarm in {(timeUntilBattle / 1000).toFixed(0)} seconds!<br />
            Choose what machines you want to attack with soon, or you'll be forced to use all your machines to defend.<br />
            <hr />
            Allocate forces to your counterstrike:<br />
            {Object.keys(this.state.machines).map(k => this.warButtons(k))}<br />
            <button onClick={() => this.runBattle()}>Strike first!</button>
        </>;
    }

    runBattle() {
        const committed: Record<string, number> = {
            horus: 0, khopesh: 0, scarab: 0,
        };
        let total = 0;
        for (const machine in this.state.busy) {
            for (const state of this.state.busy[machine]) {
                if (state === 'prepped') {
                    total++;
                    committed[machine]++;
                }
            }
        }
        if (!total) {
            // the full swarm gets attacked if they didn't commit any forces to
            // a pre-emptive strike
            Object.assign(committed, this.state.machines);
            // remove every other Chariot machine from their tasks and set them to prepped
            this.state.busy = {
                horus: new Array(this.state.machines.horus).fill('prepped'),
                khopesh: new Array(this.state.machines.khopesh).fill('prepped'),
                scarab: new Array(this.state.machines.khopesh).fill('prepped'),
            };
        }
        let enemyForce = this.state.battle.force;

        const originalForce = {...committed};
        let losses = {horus: 0, khopesh: 0, scarab: 0} as Record<string, number>;
        let totalLosses = 0;
        const originalEnemy = enemyForce;
        // scarabs first, then khopeshes, finally Horuses
        // scarabs would get hit first since they're usually out first
        loop: for (const k of ['horus', 'khopesh', 'scarab'].reverse()) {
            if (!committed[k]) continue;
            const stats = GameData.VALUES[k];
            let lost = 0;
            for (let i = 0; i < committed[k]; i++) {
                const def = stats.defense;
                const atk = stats.forceProjection;
                if (
                    // if there's more left in the enemy force, 50-50 if it survives
                    (enemyForce >= def && Math.random() > 0.5) ||
                    // if there isn't left in the enemy force, it's only a 1/5th chance
                    (enemyForce < def && Math.random() > (4/5))
                ) {
                    lost++;
                    totalLosses++;
                }
                enemyForce -= (
                    Math.round(Math.random() * def) + 
                    Math.round(Math.random() * atk)
                );
                if (enemyForce < 1) {
                    enemyForce = 0;
                    break loop;
                }
            }
            losses[k] = lost;
        }
        for (const k in committed) {
            this.state.power -= (committed[k] * GameData.VALUES[k].powerUse.fighting);
        }
        for (const k in losses) {
            let removed = losses[k];
            this.state.machines[k] -= removed;
            for (const [i, task] of this.state.busy[k].entries()) {
                if (task === 'prepped') {
                    this.state.busy[k].splice(i, 1);
                    removed--;
                    if (!removed) {
                        break;
                    }
                }
            }
        }

        // whatever you destroy, you gain back 2x in materials
        this.state.materials += ((originalEnemy - enemyForce) * 2);

        for (const k in this.state.busy) {
            this.state.busy[k] = this.state.busy[k].filter(z => z !== 'prepped');
        }

        this.state.battle = {
            last: Date.now(),
            force: 0,
            waiting: 0, 
            result: {
                losses, originalEnemy, originalForce, 
                enemyForce, totalLosses, at: Date.now(),
            },
        };
        this.save();
        return this.renderBattleResult();
    }

    save() {
        localStorage.setItem('state', JSON.stringify(this.state));
    }

    renderBattleResult() {
        const {originalEnemy, originalForce, enemyForce, losses, totalLosses} = this.state.battle.result;
        const leftPercent = ((enemyForce / originalEnemy) * 100);
        // TOFIX: Enemy force not being generated properly (0)
        const total = Object.values(originalForce as Record<string, number>).reduce((a, b) => a + b);
        return <>
            <button onClick={() => { delete this.state.battle.result; }}> x </button><br />
            Enduring Victory came at you with a force of {originalEnemy}, and you sustained {totalLosses} losses (of {total}).<br />
            {Object.entries(losses).map(([k, num]) => <>{GameData.NAMES[k]}: {num} lost (deployed {originalForce[k]})<br /></>)}<br />
            {leftPercent > 40 ? `The enemy withdrew with ${leftPercent.toFixed(2)}% of their forces left` : 
                enemyForce ? `The enemy limped away with only ${leftPercent.toFixed(2)}% of their forces left.` :
                `The enemy force was completely annihilated.`
            }
        </>;
    }

    purchaseUpgrade(upgrade: Upgrade) {
        if (!upgrade.canPurchase?.(state)) return;
        if (upgrade.price) {
            const {materials, energy} = upgrade.price;
            if (materials > this.state.materials || energy > this.state.power) {
                return false;
            }
            this.state.power -= energy;
            this.state.materials -= materials;
            this.save();
        }
        (this.state.upgrades ||= []).push(upgrade.name);
        upgrade.onPurchase?.(state);
        upgrade.onStartup?.(state, GameData);
        this.forceUpdate();
    }

    canPurchaseUpgrade(upgrade: Upgrade) {
        if (upgrade.requires) {
            if (!upgrade.requires.every(z => this.state.upgrades?.includes(z))) return false;
        }
        if (upgrade.canPurchase) {
            if (!upgrade.canPurchase(this.state)) return false;
        }
        if (upgrade.price) {
            const {materials, energy} = upgrade.price;
            if (materials > this.state.materials || energy > this.state.power) {
                return false;
            }
        }
        return true;
    }

    shouldDisplayUpgrade(upgrade: Upgrade) {
        if (upgrade.requires) {
            if (!upgrade.requires.every(z => this.state.upgrades?.includes(z))) return false;
        }
        if (upgrade.shouldDisplay) {
            if (!upgrade.shouldDisplay(this.state)) return false;
        }
        if (upgrade.price) {
            const diff = upgrade.price.showDiff || 150;
            return (
                (upgrade.price.materials - diff) > this.state.materials && 
                (upgrade.price.energy - diff) > this.state.power
            );
        }
        return true;
    }

    renderUpgrade(upgrade: Upgrade) {
        const style = !this.canPurchaseUpgrade(upgrade) ? {backgroundColor: 'grey'} : {}
        return <div style={style} className="infobox" onClick={() => this.purchaseUpgrade(upgrade)}>
            <strong>{upgrade.name}</strong><br />
            {upgrade.desc}
        </div>;
    }

    renderUpgradePanel() {
        if (!this.state.upgrades) this.state.upgrades = [];
        const upgradesAvailable = upgrades.filter(z => (
            !this.state.upgrades?.includes(z.name) && this.shouldDisplayUpgrade(z)
        ));
        const upgradeBuf = upgradesAvailable
            .sort((a, b) => !this.canPurchaseUpgrade(a) ? -1 : 1)
            .map(z => this.renderUpgrade(z));
        return <>
            Upgrades: (click to purchase) <br />
            {upgradesAvailable.length ? upgradeBuf : "None."}
        </>;
    }

    render() {
        return <table>
            <tr><th></th></tr>
            <tr>
                <td className="infobox">
                Power reserves: {this.state.power.toFixed(2)}GW<br />
                Material reserves: {this.state.materials.toFixed(2)}T<br />
                Total harvest: {(this.state.totalHarvest ||= 0).toFixed(2)}GW
                </td>
                <td className="infobox">
                    Allocate machines to collecting power:<br />
                    {['khopesh', 'scarab'].map(k => this.allocateButtons(k))}
                    <br />- Horuses cannot collect power
                    <br />- Each Scarab collects<Space /> 
                    {GameData.VALUES.scarab.collectionRate! * 10} material(s) and 
                    <Space />{(GameData.VALUES.scarab.consumeOutput * 10).toFixed(2)} power per 10 seconds
                    <br />- Each Khopesh collects {GameData.VALUES.khopesh.consumeOutput * 10} power per 10 seconds

                </td>
            </tr>
            <tr>
                <td className="infobox">
                    {Object.keys(this.state.machines).map(k => this.machineButton(k))}
                </td>
                <td className="infobox">
                    Costs:<br />
                    {Object.entries(GameData.COSTS).map(([k, vals]) => (
                        <div>{GameData.NAMES[k]}: {vals.materials} materials / {vals.energy}GW power reserves / {vals.constructionTime}s to create</div>
                    ))}
                </td>
            </tr>
            <tr>
                <td className="infobox">{this.renderWarPanel()}</td>
                <td className="infobox">{this.renderUpgradePanel()}</td>
            </tr>
        </table>
    }
}