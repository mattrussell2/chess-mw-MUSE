import { Task } from './task.js'
import { BLOCK_TYPE } from './taskinfo.js'

/*
    https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2770861/
    Stimuli were pseudorandom sequences of consonants randomly varying in case and presented in a fixed central location on a computer screen using the PsyScope software (Cohen, MacWhinney, Flatt, & Provost, 1993) for a 500-ms duration with a 2500-ms interstimulus interval. Participants completed 12 blocks of trials (three blocks of each of the four conditions), with each block consisting of 25 trials. The first three trials of each block were never targets and of the remaining trials 30% were targets. Condition order was randomized across blocks and across participants, with the constraint that all four conditions were sampled in every set of four blocks. A short break (5–20 s) between blocks was provided to allow participants to rest. Prior to the start of the actual task, participants were trained on each of the four conditions. Participants were given up to three practice blocks (of 25 trials each) per condition with feedback on their performance, until they demonstrated that they understood the task and their performance stabilized. Reaction times (RTs) and accuracy measures were obtained for each trial.
*/

const NBACK_KINDS      = [ 0, 1, 2, 3 ];
const NBACK_CONSONANTS = [ "B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N",
                           "P", "Q", "R", "S", "T", "V", "W", "Y", "Z" ];
                          
export class NBackTask extends Task {
    constructor(name, blockType, numBlocks, trialsPerBlock, jsPsych) {
        super(name, blockType, numBlocks, trialsPerBlock, jsPsych);
        
        this._nBackPct = .3;

        // which consonants to use for the 4 zero-back blocks (3 + 1 for training)
        this._zeroBackConsonants = jsPsych.randomization.sampleWithoutReplacement(NBACK_CONSONANTS, 4);
        this._zeroBackIdx = 0;

        // which blocks are practice vs task
        this._blockOrder = this._blockType == BLOCK_TYPE.PRACTICE ? Array(4).fill(BLOCK_TYPE.PRACTICE) :
                                                                    Array(this._numBlocks).fill(BLOCK_TYPE.TASK);
        
        // which nback each block is                                                            
        this._nBackBlockOrder = this._blockType == BLOCK_TYPE.PRACTICE ? [ 0, 1, 2, 3 ] :
                                [...Array(this._numBlocks).fill(this._jsPsych.randomization.shuffle(NBACK_KINDS))].flat();

        this._choices = ['y', 'n'];
        this._trial_duration = 2500;
        this._stimulus_duration = 500;         
                  
        this.makeTimeline(); 

    }

    get nBackBlockOrder() {
        return this._nBackBlockOrder;
    }

    incZeroBackIdx() {
        this._zeroBackIdx++;
    }
    
    // https://www.frontiersin.org/articles/10.3389/fpsyg.2015.01544/full
    createBlockTrials(nback) {
        const zeroBackChar = this._zeroBackConsonants[this._zeroBackIdx];

        const stimSet = JSON.parse(JSON.stringify(NBACK_CONSONANTS)); // deep copy

        if (nback === 0) stimSet.splice(stimSet.indexOf(zeroBackChar), 1); 
       
        // pick first three elements at random
        var nBackStimuli = this._jsPsych.randomization.sampleWithoutReplacement(stimSet, 3);

        for (let i = 3; i < this._trialsPerBlock; i++) {
            const nBackChar = nback === 0 ? zeroBackChar : nBackStimuli[i - nback];
            let letterToPush = nBackChar; // assume nback
            if (Math.random() > this._nBackPct) {               
                const available = JSON.parse(JSON.stringify(stimSet)); 
                available.splice(available.indexOf(nBackChar), 1);
                letterToPush = this._jsPsych.randomization.sampleWithoutReplacement(available, 1)[0];                
            }
            nBackStimuli.push(letterToPush);
        }
        return nBackStimuli.map((letter, idx) => {
            const isNBack = idx < 3 ? false : 
                            nback === 0 ? letter == zeroBackChar :
                            letter == nBackStimuli[idx - nback];
            const trialData = {
                stimulus: '<p style="font-size:50px;">' + letter + '</p>',
                choices: this._choices,                
                trial_duration: this._trial_duration,
                stimulus_duration: this._stimulus_duration,
                data: {
                    block: nback, 
                    letter: letter, 
                    isNBack: isNBack, 
                    isFirstThree: idx < 3,
                    blockType: this._blockType, 
                    experiment: "nback"                
                }
            }
            console.log(this.makeTrial(trialData));
            return this.makeTrial(trialData);
        }).flat();
    }
    
    makeTimeline() {
        this._timeline = this._nBackBlockOrder.map((nback, i) => {
            const instr = this.makeInstructionTrial(nback); 
            const trls = this.createBlockTrials(nback);            
            if (nback === 0) this._zeroBackIdx++;
            console.log(trls);
            return [instr, ...trls, this.restTrial()];
        });
    }

    getMiddleInstructions(nback) {
        switch(nback) {
            case 0:
                const zBackChar = this._zeroBackConsonants[this._zeroBackIdx];
                return "As soon as you see a new letter, press the <b>y</b> key if it is the same as the letter" + "<p style='font-size:25px'><b> " + zBackChar + "</b></p>" + "<p>Otherwise, press the <b>n</b> key. <br>For example, if you see the sequence: <br><b> C, " + zBackChar + ", F, " + zBackChar+ "</b><br> in order from left to right, you would press <b>n, y, n, y</b>"
            case 1:            
                return "As soon as you see a new letter, press the <b>y</b> key if it is the same as the letter you saw 1 letter previously - otherwise, press the 'n' key. For example, if you see the letters from the sequence<br><b> Q, R, R, T, T </b><br> you would press <br><b>n, n, y, n, y</b>"
            case 2:            
                return "As soon as you see a new letter, press the <b>y</b> key if it is the same as the letter you saw 2 letters previously - otherwise, press the 'n' key. For example, if you see the letters from the sequence<br><b> B, F, G, T, G </b><br> you would press <br><b>n, n, n, n, y</b><br> Note that you press <b>y</b> on seeing the final <b>G</b>, because upon seeing this <b>G</b>, it was also seen 2-back ago."
            case 3:             
                return "As soon as you see a new letter, press the <b>y</b> key if it is the same as the letter you saw 3 letters previously - otherwise, press the 'n' key. For example, if you see the letters from the sequence<br><b> R, S, T, R, T</b> <br> you would press <br><b>n, n, n, y, n</b>"            
        }
    }

    instructions(nback) {
        const title = "<h1>" + nback.toString() + "-Back" + (nback == 0 ? " - " + this._zeroBackConsonants[this._zeroBackIdx]  : "") +"</h1>";
        const preamble = "<br>In this experiment you will be presented with a series of letters.<br>"
        const middle = this.getMiddleInstructions(nback);
        return title + preamble + middle;
    }

    correct(data) {       
        return this._jsPsych.pluginAPI.compareKeys(data.response, data.isNBack ? "y" : "n");        
    }
}    