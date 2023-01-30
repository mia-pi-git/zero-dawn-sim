/**
 * Main game files.
 */
import {Upgrade, upgrades, MAX_LAND} from './upgrades.js';
import {machines, tasks, Machine, cauldronUnlocks} from './machines.js';
import {Tutorial} from './tutorial.js';

declare const React: typeof window.React;

interface Cauldron {
    name: string;
    // either empty, or the [machine, time creation started][]
    busy: [string, number][] | null;
    capacity: number;
    materials: number;
}

export type State = typeof GameData.DEFAULT_STATE;
export const GameData = new class {
    readonly MACHINES = machines;
    readonly TASKS = tasks;
    readonly CAULDRONS = cauldronUnlocks;
    readonly DEFAULT_STATE = {
        materials: 100,
        landRestored: 0,
        tutorialOpen: true,
        cauldrons: [{
            name: "Alpha",
            busy: null,
            capacity: 1,
            materials: 100,
        }] as Cauldron[],
        newCauldronCapacity: 1,
        totalAvailableMaterials: 200,
        landUseRate: 2,
        power: 100,
        noticed: false,
        lastTickConsumption: {
            energy: 0,
            materials: 0,
            powerSpent: 0,
            landUsed: 0,
            restored: 0,
            buff: null as string | null,
        },
        busy: {} as Record<string, string[]>,
        machines: {
            grazer: 1,
            leaplasher: 1,
            watcher: 1,
        } as Record<string, number>,
        constructing: {} as Record<string, number[]>,
        upgrades: null as null | string[],
        upgradeState: {} as any,
        currentOpenMachine: 'grazer',
        currentSearchedMachine: null as null | string,
        currentOpenCauldron: 'Alpha',
        currentOpenMachineType: 'acquisition',
        currentMaterialInputValue: null as null | string,
        // [machine, cauldron to, start date, total amount, cauldronFrom, resolver?]
        transports: [] as [string, Cauldron, number, number, string][],
        currentBuff: null as {machine: string, time: number, count: number} | null,
        humans: 0,
        villages: [] as number[],
    }

    getState(): typeof GameData.DEFAULT_STATE {
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

function upper(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function join(els: React.ReactElement[], val: React.ReactElement) {
    const out = [];
    for (const el of els) {
        out.push(el, val);
    }
    out.pop();
    return out;
}

function isMobile() {
    return screen.width <= 600;
}

function renderAsTable(els: React.ReactElement[]) {
    const out = [];
    if (isMobile()) {
        return <table width={"100%"}>{
            els.map(el => <tr><td className="infobox" width={"25%"}>{el}</td></tr>)
        }</table>
    } else {
        let curEl = [];
        for (const el of els) {
            curEl.push(<td className="infobox" width={"25%"}>{el}</td>);
            if (curEl.length === 2) {
                const buffer = <td width={"5%"}></td>;
                out.push(<tr>{[buffer, curEl[0], buffer, curEl[1], buffer]}</tr>);
                out.push(<tr><td height={"5%"}><br /></td></tr>);
                curEl = [];
            }
        }
        return <table width={"100%"}>{out}</table>;
    }
}

function toID(val: any) {
    return (val + "").toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export type Comparable = number | string | boolean | Comparable[] | {reverse: Comparable};
export function compare(a: Comparable, b: Comparable): number {
	if (typeof a === 'number') {
		return a - (b as number);
	}
	if (typeof a === 'string') {
		return a.localeCompare(b as string);
	}
	if (typeof a === 'boolean') {
		return (a ? 1 : 2) - (b ? 1 : 2);
	}
	if (Array.isArray(a)) {
		for (let i = 0; i < a.length; i++) {
			const comparison = compare(a[i], (b as Comparable[])[i]);
			if (comparison) return comparison;
		}
		return 0;
	}
	if ('reverse' in a) {
		return compare((b as {reverse: string}).reverse, a.reverse);
	}
	throw new Error(`Passed value ${a} is not comparable`);
}

function sortBy<T>(array: T[], callback?: (a: T) => Comparable) {
	if (!callback) return (array as any[]).sort(compare);
	return array.sort((a, b) => compare(callback(a), callback(b)));
}

export class Space extends React.Component {
    render() {
        return <span dangerouslySetInnerHTML={{__html: '&nbsp;'}}></span>;
    }
}

export class Value extends React.Component<{children: any}> {
    render() {
        return <span className="number">{this.props.children}</span>
    }
}

export class CauldronButtons extends React.Component {
    render() {
        const out = [];
        let i = 0;
        for (const c of state.cauldrons) {
            out.push(
                <button
                    disabled={state.currentOpenCauldron === c.name} 
                    onClick={() => { state.currentOpenCauldron = c.name; Manager.update()}}
                >{c.name}</button>
            );
            i++;
            if (i === 8) {
                out.push(<br />);
                i = 0;
            }
        }
        return out;
    }
}

export class MachineButtons extends React.Component {
    render() {
        return Object.keys(GameData.TASKS).map(type => (
            <button 
                disabled={state.currentOpenMachineType === type}
                onClick={() => { state.currentOpenMachineType = type; Manager.update()}}
            >{upper(type)}</button>
        ));
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

    get() {
        return this.panel;
    }

    update() {
        this.panel.forceUpdate();
    }

    async fade(levels: string[], timeBetween = 100) {
        const wait = () => new Promise(res => {
            setTimeout(res, timeBetween);
        });
        for (const n of levels) {
            // @ts-ignore
            document.querySelectorAll('.infobox').forEach(e => e.style['opacity'] = n);
            await wait();
        }
    }
}

export const state = GameData.getState();

export class App extends React.Component {
    state = state;
    onTransportDone?: Record<string, (machine: string, num: number) => void>;
    constructor(props: any) {
        super(props);
        Manager.use(this);
    }

    canPurchase(machine: string, amount = 1) {
        const {cost} = GameData.MACHINES[machine];
        return (
            this.state.power >= (cost.energy * amount) && 
            this.cauldronCapacityFor(cost.materials, amount)
        );
    }

    findAvailableCauldron(materials?: number) {
        return this.state.cauldrons.find(s => (
            (!s.busy || s.busy.length < s.capacity) && (!materials || s.materials >= materials)
        ));
    }

    cauldronCapacityFor(materials: number, amount = 1) {
        let openMaterials = 0;
        let openSpaces = 0;
        for (const cauldron of state.cauldrons) {
            openSpaces += (cauldron.capacity - (cauldron.busy || []).length);
            openMaterials += cauldron.materials
        }
        return openMaterials >= (materials * amount) && openSpaces >= amount;
    }

    tryPurchaseOne(machine: string) {
        if (!this.canPurchase(machine, 1)) return false;
        const cost = GameData.MACHINES[machine].cost;
        const cauldron = this.findAvailableCauldron(cost.materials);
        if (!cauldron) return false
        this.state.power -= cost.energy;
        cauldron.materials -= cost.materials;
        this.state.totalAvailableMaterials -= cost.materials;
        const now = Date.now();
        (cauldron.busy ||= []).push([machine, now]);
        this.forceUpdate();
        return true;
    }

    tryPurchase(machine: string, count = 1) {
        for (let i = 0; i < count; i++) {
            if (!this.tryPurchaseOne(machine)) return false;
        }
    }

    calculateBuff() {
        const {machine, time, count} = this.state.currentBuff || {};
        if (!machine || !time) return 1;
        const data = GameData.MACHINES[machine];
        if (data.type !== 'recon') return 1;
        if (((Date.now() - time) > (data.buffDuration * 1000)) || !count) {
            this.state.currentBuff = null;
            return 1;
        }
        this.state.currentBuff!.count--;
        return data.buffMultiplier;
    }

    tick() {
        if (this.state.tutorialOpen) {
            return this.forceUpdate();
        }
        let totalRestored = 0;
        let totalEnergy = 0;
        let totalMaterials = 0;
        let landUsed = 0;
        let spentPower = 0;
        if (this.state.landRestored >= MAX_LAND) {
            // decay instead at a random rate 
            this.state.landRestored -= Math.random() * 50_000;
        }
        if (this.state.upgrades?.includes("Solar Arrays")) {
            const gain = this.state.cauldrons.length;
            this.state.power += gain;
            totalEnergy += gain;
        }

        for (const machine in this.state.machines) {
            if (!this.state.busy[machine]) this.state.busy[machine] = [];
            if (!this.state.busy[machine].length) continue;
            const data = GameData.MACHINES[machine];
            if (data.type !== 'recon') continue;
            for (const busy of this.state.busy[machine]) {
                if (busy !== 'recon') continue;
                if (data.locationChance > Math.random()) {
                    if (this.state.currentBuff) {
                        const m = GameData.MACHINES[this.state.currentBuff.machine];
                        if (m.type !== 'recon') continue; // typechecking
                        if (m.buffMultiplier > data.buffMultiplier) continue;
                    }
                    this.state.currentBuff = {
                        machine, time: Date.now(), count: data.buffRange,
                    };
                }
                this.state.power -= data.powerConsumption;
                spentPower += data.powerConsumption;
            }
        }

        for (const machine in this.state.machines) {
            const data = GameData.MACHINES[machine];
            if (data.type !== 'acquisition') continue;
            const terraforming = this.state.busy[machine].filter(f => f === 'terraforming');
            for (const _ of terraforming) {
                totalRestored += data.restoreRate;
                this.state.landRestored += data.restoreRate;
                this.state.power -= data.powerConsumption;
                spentPower += data.powerConsumption;
                if (this.state.power < 0) {
                    this.state.power = 0;
                    return;
                }
            }
            const collecting = this.state.busy[machine].filter(f => f === 'collecting');
            if (collecting.length > 0 && this.state.landRestored > 0) {
                for (const _ of collecting) {
                    if (this.state.landRestored < 0) {
                        this.state.landRestored = 0;
                        break;
                    }
                    landUsed += (data.outputRate.power / this.state.landUseRate);
                    totalMaterials += (data.outputRate.materials * this.calculateBuff());
                    totalEnergy += data.outputRate.power;
                    spentPower += data.powerConsumption;

                    this.state.landRestored -= (data.outputRate.power / this.state.landUseRate);
                    this.state.power += data.outputRate.power;
                    this.state.materials += (data.outputRate.materials * this.calculateBuff());
                    this.state.totalAvailableMaterials += (data.outputRate.materials * this.calculateBuff());
                    this.state.power -= data.powerConsumption;

                    if (this.state.power < 0) {
                        this.state.power = 0;
                        return;
                    }
                }
            }
        }

        if (this.state.transports.length) {
            for (const [i, [machine, {name}, startDate, materials]] of this.state.transports.entries()) {
                const data = GameData.MACHINES[machine];
                if (data.type !== 'transport') continue; // typechecking 
                const willFinishSec = data.transportSpeed * 1000;
                if (Date.now() > (willFinishSec + startDate)) {
                    const cauldron = this.state.cauldrons.find(z => z.name === name);
                    if (cauldron) {
                        cauldron.materials += materials;
                        this.state.transports.splice(i, 1);
                        // remove busy entry, free machine
                        this.removeBusy(machine, 'transporting', true);
                        this.onTransportDone?.[cauldron.name]?.(machine, materials);
                    }
                } else {
                    this.state.power -= data.powerConsumption;
                    spentPower += data.powerConsumption;
                }
            }
        }

        for (const cauldron of this.state.cauldrons) {
            if (!cauldron.busy) continue;
            for (const [i, creation] of cauldron.busy.entries()) {
                const [machine, startDate] = creation;
                const timeRequired = GameData.MACHINES[machine].creationTime;
                const duration = timeRequired * 1000;
                if ((startDate + duration) <= Date.now()) {
                    if (!this.state.machines[machine]) this.state.machines[machine] = 0;
                    this.state.machines[machine]++;
                    cauldron.busy.splice(i, 1);
                }
            }
            if (!cauldron.busy.length) cauldron.busy = null;
        }
        for (const u of (this.state.upgrades ||= [])) {
            const upgrade = upgrades.find(z => z.name === u);
            upgrade?.onLoop?.(state, GameData, this);
        }

        if (this.state.humans) {
            const deathRate = 20 / 1000;
            const birthRate = 27 / 1000;
            for (let [i, pop] of this.state.villages.entries()) {
                pop -= Math.round(Math.random() * (((pop * deathRate) + landUsed)));
                pop += Math.round(Math.random() * ((pop * birthRate) + totalRestored));

                // hard cap
                if (Math.random() > 0.995 && pop > 50 && this.state.villages.length < 500) {
                    this.state.villages.push(Math.round(pop / 2));
                    pop = Math.floor(pop / 2);
                }
            
                if (pop <= 0) {
                    this.state.villages.splice(i, 1);
                } else {
                    this.state.villages[i] = pop;
                }
            }
            this.state.humans = this.state.villages.reduce((a, b) => a + b);
        }

        this.state.lastTickConsumption = {
            restored: totalRestored,
            landUsed,
            powerSpent: spentPower,
            energy: totalEnergy,
            materials: totalMaterials,
            buff: this.state.currentBuff?.machine || null,
        };

        this.save();
        this.forceUpdate();
    }

    canBreakDown(machine: string) {
        const busy = this.state.busy[machine] ||= [];
        return (
            busy.length < this.state.machines[machine] &&
            this.state.machines[machine]
        );
    }

    tryBreakDown(machine: string) {
        if (!this.canBreakDown(machine)) return;
        const data = GameData.MACHINES[machine];
        this.state.materials += data.cost.materials;
        this.state.totalAvailableMaterials += data.cost.materials;
        this.state.power += (data.cost.energy / 2);
        this.state.machines[machine]--;
        this.save();
        this.forceUpdate();
    }

    machineButton(k: string) {
        const data = GameData.MACHINES[k];
        return <>
            {data.name}: <Value>{this.state.machines[k]}</Value><Space />
            <button 
                disabled={!this.canPurchase(k)} 
                onClick={() => this.tryPurchase(k)}
            >+</button><Space />
            <button 
                disabled={!this.canPurchase(k, 10)} 
                onClick={() => this.tryPurchase(k, 10)}
            >+10</button><Space />
            <button 
                disabled={!this.canPurchase(k, 100)} 
                onClick={() => this.tryPurchase(k, 100)}
            >+100</button><Space />
            <button
                disabled={!this.canBreakDown(k)}
                onClick={() => this.tryBreakDown(k)}
            >-</button><Space />
            ({data.cost.energy} power, {data.cost.materials} materials, {data.creationTime}s)
        </>;
    }
    purchaseUnlocked(machine: string) {
        const data = GameData.MACHINES[machine];
        if (data.purchaseUnlocked) {
            if (!data.purchaseUnlocked(this.state)) return false;
        }
        let cauldronNeeded = 'Alpha';
        for (const c in GameData.CAULDRONS) {
            if (GameData.CAULDRONS[c].includes(data.name)) {
                cauldronNeeded = c;
            }
        }
        if (!this.state.cauldrons.find(z => z.name === cauldronNeeded)) {
            return false;
        }
        return true;
    }



    renderMachinePurchasePanel() {
        const machines = sortBy(
            Object.keys(GameData.MACHINES)
                .filter(z => GameData.MACHINES[z].type === state.currentOpenMachineType)
                .filter(z => this.purchaseUnlocked(z)),
            m => -this.state.machines[m] || Infinity,
        );
        return <>
            View machines of type: <br /><MachineButtons /><br />
            {join(machines.map(k => this.machineButton(k)), <br />)}
        </>;
    }
    allocateButtons(machine: string) {
        const canAllocate = this.state.machines[machine] > this.state.busy[machine]?.length;
        const canDeallocate = this.state.busy[machine] ||= [];
        // remove ones on active transport duty, those can't be removed
        for (const [machine] of this.state.transports.entries()) {
            const idx = this.state.busy[machine].indexOf('transporting');
            if (idx > -1) {
                this.state.busy[machine].splice(idx, 1);
            }
        }
        return <>
            {GameData.MACHINES[machine].name} ({canDeallocate.length}):<Space />
            <button disabled={!canAllocate} onClick={() => this.setBusy(machine, 'consuming')}> + </button> 
            <button disabled={!canDeallocate.length} onClick={() => this.removeBusy(machine, 'consuming')}> - </button> 
            <br />
        </>;
    }

    setBusy(machine: string, task: string) {
        if (!this.state.busy[machine]) this.state.busy[machine] = [];
        if (this.state.machines[machine] > this.state.busy[machine].length) {
            this.state.busy[machine].push(task);
            this.forceUpdate();
        }
    }

    removeBusy(machine: string, task: string, force = false) {
        if (!this.state.busy[machine]) this.state.busy[machine] = [];
        const idx = this.state.busy[machine].indexOf(task);
        // can't remove a machine from transport if it's actively doing that
        if (!force && task === 'transporting' && this.state.transports.some(z => z[0] === machine)) {
            return false;
        }
        if (idx > -1) {
            this.state.busy[machine].splice(idx, 1);
            this.forceUpdate();
        }
    }
    countBusy(machine: string, state: string) {
        return this.state.busy[machine].filter(f => f === state).length;
    }

    save() {
        localStorage.setItem('state-' + document.title, JSON.stringify(this.state));
    }

    selectMachine(machine: string) {
        this.state.currentOpenMachine = machine;
        this.forceUpdate();
    }

    taskButton(machine: string, task: string) {
        const deallocate = () => this.removeBusy(machine, task);
        const allocate = () => this.setBusy(machine, task);

        const canAllocate = this.state.machines[machine] > (this.state.busy[machine] ||= []).length
        const canDeallocate = this.state.busy[machine].length;

        const doingTask = this.state.busy[machine].filter(z => z === task).length;
        const data = GameData.MACHINES[machine];
        let addendum = <></>;
        switch (task) {
        case 'collecting':
            if (data.type === 'acquisition') {
                addendum = (
                    <>({(data.outputRate.power * doingTask).toFixed(2)} energy/s,<Space /> 
                    {(data.outputRate.materials * doingTask).toFixed(2)} materials/s)</>
                );
            }
            break;
        case 'terraforming':
            if (data.type === 'acquisition') {
                addendum = <>({(data.restoreRate * doingTask).toFixed(2)} km^2 per sec)</>;
            }
            break;
        }
        return <>
            {upper(task)}: (<Value>{this.countBusy(machine, task)}</Value>)<Space />
            <button disabled={!canAllocate} onClick={allocate}> + </button><Space />
            <button disabled={!canDeallocate} onClick={deallocate}>-</button><Space />{addendum}
        </>;
    }

    renderMachineAllocator() {
        const machine = this.state.currentOpenMachine;
        const machineData = GameData.MACHINES[machine];
        return <>
            Select a machine to allocate to a task:
            <select value={machine} onChange={(e) => this.selectMachine(e.target.value)}>
                {Object.keys(this.state.machines).map(z => (
                    <option value={z}>{GameData.MACHINES[z].name}</option>
                ))}
            </select><br />
            Available tasks: <br />
                {join(GameData.TASKS[machineData.type].map(task => this.taskButton(machine, task)), <br />)}
        </>;
    }

    cauldronInputKeyDown(
        cauldron: Cauldron, event: React.KeyboardEvent<HTMLInputElement>, type: '+' | '-'
    ) {
        // this.state.currentMaterialInputValue = event.currentTarget.value;
        if (event.keyCode !== 13) {
            return;
        }
        let num = parseInt(event.currentTarget.value);
        event.currentTarget.value = '';
        if (isNaN(num)) {
            alert(`Invalid number of materials to move.`);
            return;
        }

        switch (type) {
        case '+':
            // find all available transports, divvy up the materials, send them out
            while (num) {
                let machine: [string, Machine] | null = null;
                const transports = sortBy(
                    Object.keys(this.state.machines)
                        .filter(z => GameData.MACHINES[z].type === 'transport'),
                    // @ts-ignore guaranteed to have it by above filter
                    a => -GameData.MACHINES[a].carryingCapacity
                );
                for (const k of transports) {
                    if (this.state.busy[k]?.length < this.state.machines[k]) {
                        machine = [k, GameData.MACHINES[k]];
                        // breaking here means highest capacity machines come first
                        break;
                    }
                }
                if (!machine) {
                    return alert(`No more transport machines available, ${num} materials cannot be sent.`);
                }
                // @ts-ignore
                let amount = num > machine[1].carryingCapacity ? machine[1].carryingCapacity : num;
                num -= amount;
                this.state.materials -= amount;
                if (this.state.materials < 0) {
                    num += Math.abs(this.state.materials);
                    this.state.materials = 0;
                    return alert(`Main material reserve is empty. ${num} materials could not be moved.`);
                }
                this.state.transports.push([
                    machine[0], cauldron, Date.now(), amount, 'main reserve',
                ]);
                (this.state.busy[machine[0]] ||= []).push('transporting');
            }
            break;
        case '-':
            if ((cauldron.materials - num) < 0) {
                return alert(
                    `Cannot remove ${num} materials - ` +
                    `Cauldron ${cauldron.name} only has ${cauldron.materials} in storage.`
                );
            }
            cauldron.materials -= num;
            this.state.totalAvailableMaterials += num;
            this.state.materials += num;
            break;
        }
        (event.currentTarget as any).value = '';
    }

    makeProgressBar(startDate: number, endDate: number) {
        const nowDiff = Math.abs(Date.now() - startDate);
        const totalDiff = Math.abs(endDate - startDate);
        const value = Math.round((nowDiff / totalDiff) * 100);
        return <progress value={value} max={100}></progress>;
    }

    renderCauldron(c: Cauldron) {
        const transportsTo = this.state.transports.filter(z => z[1].name === c.name);
        
        const sortedTransports = transportsTo.map(z => {
            const machine = GameData.MACHINES[z[0]];
            const time = (machine as any).transportSpeed * 1000;
            return <>
                From {z[4]} ({z[3]}): {this.makeProgressBar(z[2], time + z[2])}
            </>;
        });
        return <li>
            <Value>Cauldron {c.name}:</Value><br />
            Material reserves: <Value>{c.materials ||= 0}T</Value>
            <br />
            Current tasks: {c.busy?.length ? join(c.busy.map(z => this.renderCauldronTask(z)), <br />) : "None"}<br />
            Add materials: <input size={8} onKeyDown={e => this.cauldronInputKeyDown(c, e, '+')}/><Space />
            <small>(click Enter to deploy changes)</small><br />
            Remove materials: <input size={8} onKeyDown={e => this.cauldronInputKeyDown(c, e, '-')} />
            {sortedTransports.length ? <><br />Resource movements: <br />{join(sortedTransports, <br />)}</> : <></>}
        </li>;
    }

    renderCauldronTask(z: [string, number]) {
        const creationCompletion = (
            z[1] + (GameData.MACHINES[z[0]].creationTime * 1000)
        );
        return <>
            {z[0]} ({this.makeProgressBar(z[1], creationCompletion)})
        </>;
    }

    calculateCauldronCost(nextCauldron: string) {
        const cauldronArr = Object.keys(GameData.CAULDRONS);
        const cauldronIdx = cauldronArr.indexOf(nextCauldron);
        const cost = {energy: 200, materials: 200};
        const multiplier = cauldronIdx * 2;
        cost.energy = cost.energy + (cost.energy * multiplier);
        cost.materials = cost.materials + (cost.materials * multiplier);
        return cost;
    }

    nextCauldron() {
        return Object.keys(GameData.CAULDRONS).filter(
            z => !this.state.cauldrons.find(f => f.name === z)
        )[0];        
    }

    tryPurchaseCauldron(cauldron: string) {
        const cost = this.calculateCauldronCost(cauldron);
        if (!(this.state.materials >= cost.materials && this.state.power >= cost.energy)) {
            return;
        }
        this.state.materials -= cost.materials;
        this.state.power -= cost.energy;
        this.state.cauldrons.push({
            name: cauldron,
            busy: null,
            materials: 0,
            capacity: this.state.newCauldronCapacity,
        });
        this.forceUpdate();
    }

    renderCauldronPurchase() {
        const nextCauldron = this.nextCauldron();
        if (!nextCauldron) return <></>;
        const cost = this.calculateCauldronCost(nextCauldron);
        const canPurchase = (
            this.state.materials >= cost.materials && this.state.power >= cost.energy
        );
        const unlocks = GameData.CAULDRONS[nextCauldron];
        return <>
            <hr />
            Next Cauldron: {nextCauldron}<br />
            Cost: {cost.materials} materials and {cost.energy} power<br />
            {unlocks.length ? <>Unlocks: {unlocks.join(', ')}<br /></> : <></>}
            <button disabled={!canPurchase} onClick={() => this.tryPurchaseCauldron(nextCauldron)}>Purchase</button>
        </>
    }

    selectCauldron(cName: string) {
        this.state.currentOpenCauldron = cName;
        this.forceUpdate();
    }

    renderCauldronSearch() {
        const cName = this.state.currentOpenCauldron;
        if (cName) {
            const cauldron = this.state.cauldrons.find(z => z.name === cName)!;
            return <> 
                Select Cauldron to manage:<br />
                <CauldronButtons /><hr />
                {this.renderCauldron(cauldron)}
            </>;
        }
        return <>
            Select Cauldron to manage:<br />
            <CauldronButtons /><br />
        </>;
    }

    renderCauldronPanel() {
        return <>
            Cauldrons:<br />
            {this.state.cauldrons.length < 3 ? 
                <ul>{this.state.cauldrons.map(c => this.renderCauldron(c))}</ul> : 
                this.renderCauldronSearch()
            }
            {this.renderCauldronPurchase()}
        </>;
    }

    purchaseUpgrade(upgrade: Upgrade) {
        if (upgrade.canPurchase && !upgrade.canPurchase(state)) return;
        if (upgrade.price) {
            const {materials, energy} = upgrade.price;
            if (materials > this.state.materials || energy > this.state.power) {
                return false;
            }
            this.state.power -= energy;
            this.state.materials -= materials;
            this.state.totalAvailableMaterials -= materials;
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
                (upgrade.price.materials - diff) <= this.state.materials && 
                (upgrade.price.energy - diff) <= this.state.power
            );
        }
        return true;
    }

    renderUpgrade(upgrade: Upgrade) {
        const style = !this.canPurchaseUpgrade(upgrade) ? {backgroundColor: 'grey'} : {}
        return <div style={style} className="infobox" onClick={() => this.purchaseUpgrade(upgrade)}>
            <strong>{upgrade.name}</strong><br />
            {upgrade.desc} {upgrade.price ? `Costs: ${upgrade.price.energy} energy, ${upgrade.price.materials} materials` : ``}
        </div>;
    }

    renderUpgradePanel() {
        if (!this.state.upgrades) this.state.upgrades = [];
        const upgradesAvailable = upgrades.filter(z => (
            !this.state.upgrades?.includes(z.name) && this.shouldDisplayUpgrade(z)
        ));
        const upgradeBuf = sortBy(upgradesAvailable, z => (z.price ? -(z.price.energy + z.price.materials) : Infinity))
            .map(z => this.renderUpgrade(z));
        return <>
            Upgrades: (click to purchase) <br />
            {upgradesAvailable.length ? upgradeBuf : "None."}
        </>;
    }

    handleSearchEvent(ev: React.KeyboardEvent<HTMLElement>) {
        if (ev.keyCode !== 13) return;
        const text = toID((ev.currentTarget as any).value);
        (ev.currentTarget as any).value = '';
        if (!GameData.MACHINES[text]) {
            return alert('Machine ' + text + " not found.");
        } 
        this.state.currentSearchedMachine = text;
        this.forceUpdate();
    }

    renderMachineTypeDetails(m: Machine) {
        switch (m.type) {
        case 'acquisition':
            return <>
                Output: <Value>{m.outputRate.power}</Value> power/sec, <Value>{m.outputRate.materials}</Value> materials/sec<br />
                Terraform rate: <Value>{m.restoreRate}</Value>/sec
            </>;
        case 'recon':
            // 1 - 0.8 is 0.19999999999999996 because js, so this fixes that 
            // (and also makes it easily understood)
            const fixedChance = Math.round((1 - m.locationChance) * 100);
            return <>
                Chance to temporarily buff acquisition machines: <Value>{fixedChance}</Value>%<br />
                Buff amount: <Value>{m.buffMultiplier}x</Value> power/sec and materials/sec<br />
                Buff ends after <Value>{m.buffRange}</Value> machines are buffed or <Value>{m.buffDuration}</Value> seconds pass
            </>
        case 'transport':
            return <>
                Carrying capacity: <Value>{m.carryingCapacity}</Value><br />
                Transport duration: <Value>{m.transportSpeed}</Value>
            </>;
        case 'combat':
            return <>
                Attack: <Value>{m.attackPower}</Value><br />
                Power consumption during combat: <Value>{m.combatPowerConsumption}</Value>
            </>;
        }
    }

    renderSearchPanel() {
        const machine = this.state.currentSearchedMachine;
        if (machine) {
            const data = GameData.MACHINES[machine];
            return <>
                Search machine data: <small>(type in a machine name to get its stats)</small><br />
                <input onKeyDown={(ev) => this.handleSearchEvent(ev)} /><br />
                <strong>{data.name}:</strong><br />
                Power consumption: <Value>{data.powerConsumption}</Value>/sec<br />
                Cost: <Value>{data.cost.energy}</Value> power, <Value>{data.cost.materials}</Value> materials<br />
                Type: <Value>{upper(data.type)}</Value><br />
                Time to create: <Value>{data.creationTime}</Value> seconds<br />
                Defense: <Value>{data.defense}</Value><br />
                {this.renderMachineTypeDetails(data)}
            </>;
        }
        return <>
            Search machine data:<br />
            <input onKeyDown={(ev) => this.handleSearchEvent(ev)} />
        </>;
    }

    renderLastTickStatsPanel() {
        // ({(((stats.restored / stats.landUsed)) * 100).toFixed(2)}%)<br />
        const stats = this.state.lastTickConsumption; // @ts-ignore
        const buff = stats.buff ? GameData.MACHINES[stats.buff].buffMultiplier : 0;
        return <>
            Per-second stats:
            <ul>
                <li>Land restored: <Value>{stats.restored.toFixed(2)}</Value></li>
                <li>Land used for power: <Value>{stats.landUsed.toFixed(2)}</Value></li>
                <li>Power acquired: <Value>{stats.energy.toFixed(2)}</Value></li>
                <li>Power spent: <Value>{stats.powerSpent.toFixed(2)}</Value></li>
                <li>Materials acquired: <Value>{stats.materials.toFixed(2)}</Value></li>
                <li>Recon machine boost: <Value>{buff ? <>{buff}x ({stats.buff})</> : <>None</>}</Value></li>
            </ul>
        </>;
    }

    tryReset() {
        const out = prompt("Are you sure you want to reset your game? Type 'yes' to confirm.");
        if (toID(out) === 'yes') {
            this.state = GameData.DEFAULT_STATE;
            this.save();
            this.forceUpdate();
        }
    }

    openTutorial() {
        return Manager.fade(['0.85', '0.8', '0.6', '0.4', '0.2', '0.0']).then(() => {
            this.state.tutorialOpen = true;
            this.forceUpdate();
        });
    }

    renderMiscButtons() {
        return <>
            <button onClick={() => this.openTutorial()}>Reread tutorial information.</button>
            <Space />
            <button onClick={() => this.tryReset()}>Reset game</button>
        </>
    }

    renderResourcePanel() {
        return <>
            Power reserves: <Value>{this.state.power.toFixed(2)}GW</Value><br />
            Unallocated material reserves: <Value>{this.state.materials.toFixed(2)}T</Value><br />
            Total material reserves: <Value>{this.state.totalAvailableMaterials.toFixed(2)}T</Value><br />
            Land terraformed: <Value>{this.state.landRestored.toFixed(2)} KM^2</Value>
            {this.state.humans ?
                <>
                    <br />World population: <Value>{this.state.humans}</Value><br />
                    Total settlements: <Value>{this.state.villages.length}</Value>
                </> : <></>
            }
        </>
    }

    render() {
        if (this.state.tutorialOpen) {
            return <Tutorial />;
        }
        return <>
            {renderAsTable([
               this.renderResourcePanel(),
                this.renderMachineAllocator(),         
                this.renderLastTickStatsPanel(),
                this.renderCauldronPanel(),
                this.renderMachinePurchasePanel(),
                this.renderSearchPanel(),
                this.renderUpgradePanel(),
                this.renderMiscButtons(),
            ])}
            <div className="footer">
                <hr />
                <button>
                    Version: 0.2
                    <Space />|<Space />
                    <a href="https://github.com/mia-pi-git/zero-dawn-sim">Source code</a>
                    <Space />|<Space />
                    <a href="https://www.tumblr.com/mia-is-pi">Contact site owner</a>
                </button>
            </div>
        </>;
    }
}

// animate!
setTimeout(() => {
    void Manager.fade(['0.0', '0.2', '0.4', '0.6', '0.8', '0.85']);
}, 10);