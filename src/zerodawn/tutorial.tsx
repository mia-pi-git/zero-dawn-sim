declare const React: typeof window.React;

export class Tutorial extends React.Component {
    /** This is horrible but let me be */
    close() {
        const app = (window as any).app as typeof import('./index');
        app.Manager.fade(['0.85', '0.8', '0.6', '0.4', '0.2', '0.0']).then(() => {
            app.state.tutorialOpen = false; 
            app.Manager.get().forceUpdate(); 
        });
    }
    render() {
        return <div className="infobox">
            Greetings.<br />
            As you probably know, your task is to deactivate the Faro Plague and restore the world's biosphere.<br />
            The Faro Plague has been deactivated, courtesy of MINERVA, so now comes the second task.<br />
            You have several starter machines and a Cauldron, as well as materials and power stored from before the Plague.<br />
            Your machines can harvest materials and power from the land they terraform, but you must be careful not to over-harvest, lest you destroy all of what has been created.<br />
            Each machine is of a different type, and can do different things.<br />
            - Acquisition machines acquire materials and terraform the land. 
            Your starter acquisition machines, Grazers, specialize in both, but as you create new Cauldrons and unlock more machine designs, different acquisition machines will specialize in one or the other.<br />
            - Transport machines move materials from your stores to Cauldrons, so that you can make new machines.<br />
            - Recon machines scout out land, and have a chance to spot particularly rich pieces of land, which will improve the output of acquisition machines harvesting said land.<br />
            Good luck to you!<br />
            <button onClick={() => this.close()}>Start!</button>
        </div>;
    }
}