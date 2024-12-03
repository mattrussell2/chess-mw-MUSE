/*
    expdata.js
    Experiment Data class which contains all jsPsych info and Muse data.
*/

export class ExpData {
    constructor() {
        this._eeg = [];
        this._ppg = [];
        this._telem = [];
        this._events = [];
        this._trialData = [];
    }

    addMuseClient(museClient) {
        this._museClient = museClient;
        this._museClient.eegReadings.subscribe((r) => this._eeg.push(r));
        this._museClient.ppgReadings.subscribe((r) => this._ppg.push(r));
        this._museClient.telemetryData.subscribe((r) => this._telem.push(r));
        this._museClient.eventMarkers.subscribe((e) => this._events.push(e));
    }

    injectMuseMarker(marker) {
        if (this._museClient === undefined) return;
        this._museClient.injectMarker(marker);
    }

    addTrialData(data) {
        this._trialData.push(data);
    }

    toJSON(){
        return Object.fromEntries(
                    Object.entries(this).filter(([k]) => ['_eeg','_ppg','_telem','_events','_trialData'].includes(k))
                );
    }

    async exportDATA() {                    
        const blob = new Blob([ JSON.stringify(this.toJSON()) ]);
        const result = await fetch( `http://localhost:8002`, { method: "POST", body: blob } );
        console.log(result);
    }

    clear() {
        this._eeg = [];
        this._ppg = [];
        this._telem = [];
        this._events = [];
        this._trialData = [];
    }
}