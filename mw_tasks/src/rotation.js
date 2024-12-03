import { Task } from './task.js'
import { BLOCK_TYPE } from './taskinfo.js'
/*
    https://openpsychologydata.metajnl.com/articles/10.5334/jopd.ai
    Participants carried out two blocks of 48 trials, for a total of 96 trials. In each block, the four orientations occurred equally often. On half of the trials, the objects in a pair were the same, with the exception of rotation. The order of the trials was randomized, but no more than three same or different trials occurred consecutively. In each task, before the first experimental trial, participants performed 12 practice trials using stimuli not used in the actual experiment, where the computer provided feedback on their answer.
*/

const ROTATION_ANGLES = ["0", "50", "100", "150"];
const PROPORTION_SAME = 0.5;

export class RotationTask extends Task {
    constructor(name, blockType, numBlocks, trialsPerBlock, jsPsych) {
        super(name, blockType, numBlocks, trialsPerBlock, jsPsych);
    
        this._blockOrder = Array(numBlocks).fill(blockType);
        

        this._availableRotationFiles = []
        for (let i = 1; i < 49; i++) {
            for (let rot of [0, 50, 100, 150]) {
                for (let refl of ['', '_R']) {
                    const fstr = i.toString() + "_" + rot.toString() + refl + ".jpg";
                    this._availableRotationFiles.push(fstr);
                }
            }
        }

        // jspsych trial options
        this._choices = ['y', 'n'];
        this._trial_duration = 7500;
        this._stimulus_duration = null;

        this.makeTimeline();
    }
    
    getValidRotationTrial(bData) {
        const end = bData.length;

        const imnum = Math.floor(Math.random() * 47) + 1;
        const angle = this._jsPsych.randomization.sampleWithoutReplacement(ROTATION_ANGLES, 1)[0]  
        
        var reflected = Math.random() >= PROPORTION_SAME;
        if (end > 1) {                        
            if (bData[end - 1][1].data.reflected && bData[end - 2][1].data.reflected) {
                reflected = false;
            }else if (!bData[end - 1][1].data.reflected && !bData[end - 2][1].data.reflected) {
                reflected = true;
            }
        }
        const st = imnum.toString() + "_" + angle + (reflected ? "_R" : "");           
        if (this._availableRotationFiles.includes(st + ".jpg")) {

            //https://openpsychologydata.metajnl.com/articles/10.5334/jopd.ai
            return this.makeTrial({ 
                choices: this._choices,
                stimulus: '<img src="assets/' + st + '.jpg' + '" style="width: 100%; height: 100%"/>',
                trial_duration: this._trial_duration,
                stimulus_duration: this._stimulus_duration,
                data: {
                    imnum: imnum, 
                    angle: angle, 
                    reflected: reflected,   
                    blockType: this._blockType,
                    experiment: "rotation",    
                    stimfile: st + ".jpg"                 
                }
            });
        }else {
            return null;
        }
    }
    
    // enforce all trials are unique. 
    makeBlockTrials() {
        let blockTrials = [];
        for (let trialNum = 0; trialNum < this._trialsPerBlock; trialNum++) {                    
            let trial = null;  
            while (trial === null) {
                trial = this.getValidRotationTrial(blockTrials); //, blockType, jsPsych);
            }
            blockTrials.push(trial);            
            this._availableRotationFiles.splice(this._availableRotationFiles.indexOf(trial[1].data.stimfile), 1);
        }        
        return blockTrials.flat();
    }
    

    instructions() {
        const title = "<h1>Rotating Blocks</h1>";
        const body = "<br>In this experiment you will be presented with a series of sets of two pictures of blocks. <br>As soon as you see a new set of pictures, press the <b>y</b> key if the two blocks are in fact the same (one could be rotated to produce the other), or press the <b>n</b> key if the two blocks are not the same (one could not be rotated to produce the other)."
        return title + body;
    }

    correct(data) {        
        return this._jsPsych.pluginAPI.compareKeys(data.response, (data.reflected ? 'n' : 'y'));        
    }

}