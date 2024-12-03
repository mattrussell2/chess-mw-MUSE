/*
 * task.js
 * Exports a Task class which is used to instantiate all of the various task types in the experiment.
 * Enables easy creation of task timelines and trial data.
*/

import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import { runTimer } from './timer.js';
import { BLOCK_TYPE } from './taskinfo.js';
import { restTrialLength, initHTMLAssets } from './taskinfo.js';

export class Task {
    constructor(name, blockType, numBlocks, trialsPerBlock, jsPsych) {
        this._name = name;
        this._blockType = blockType;
        this._numBlocks = numBlocks; 
        this._trialsPerBlock = trialsPerBlock;                
        this._jsPsych = jsPsych;
        this._blockStimuli = [];
        this._blockOrder = [null];        
        this._timeline = [];
        this._postTrialGap = 250;
    }

    get blockStimuli() { return this._blockStimuli; }
    get blockOrder() { return this._blockOrder; }
    get timeline() { return this._timeline; }
    get name() { return this._name; }
    
    makeInstructionTrial(optArgs=null) {
        let localInstructions = this.instructions(optArgs);
        const ask = "<br>Please ask the experimenter if you have any questions<br>"
        const enter = this._blockType == BLOCK_TYPE.PRACTICE ? "<br>Press Enter to begin a set of <b>training trials</b>.</br>" :
                                                         "<p style='text-size:30px;color:red'><br><b>Press Enter to begin the experiment [NOT TRAINING TRIALS].</b></br>";
        return {
            type: htmlKeyboardResponse,
            stimulus: localInstructions + ask + enter,
            choices: ['Enter'],
            data: { blockType: this._blockType == BLOCK_TYPE.PRACTICE ? BLOCK_TYPE.PRACTICE_INSTRUCTION : 
                                                                  BLOCK_TYPE.TASK_INSTRUCTION }
        }
    }

    makeTrial(trialData) {
        const t = [];
        t.push(this.fixation_trial());

        const trial = {
            type: htmlKeyboardResponse,            
            on_finish: (data) => {                
                data.correct = this.correct(data);
            },
            post_trial_gap: this._postTrialGap // inter-trial interval [iti]
        }
        
        for (const key in trialData) {
            trial[key] = trialData[key];
        }
        t.push(trial); 

        if (this._blockType == BLOCK_TYPE.PRACTICE) {            
            t.push(this.feedbackTrial());
        }
                       
        return t;
    }
    
    nextTrialInfo() {         
        const currStim = this._blockStimuli[this._blockIdx][this._trialIdx];
        this.update();
        return currStim;        
    }
        
    feedbackTrial() {
        return {
            type: htmlKeyboardResponse,
            trial_duration: 1000,
            stimulus: () => {
                return '<p style="font-size:30px;">' + (this._jsPsych.data.get().last(1).values()[0].correct ? 'Correct!</p>' : "Wrong.</p>");
            },
            data: { experiment: 'feedback', blockType: this._blockType, correct: 'null' }
        };
    }

    askRepeatTrial() {
        return {
            type: htmlKeyboardResponse,
            choices: ['r', 'Enter'],
            stimulus: () => {
                return '<p style="font-size:30px;">Would you like to repeat the training for this task? Press <b>r</b> to repeat, or <b>Enter</b> to continue</p>';
            }, 
            data: { experiment: 'ask_repeat', blockType: this._blockType, correct: 'null' }
        };
    }

    fixation_trial() {
        return {
            type: htmlKeyboardResponse,
            stimulus: '+',
            trial_duration: 500,
            response_ends_trial: false,
            data: { experiment: 'fixation', blockType: this._blockType, correct: 'null' }            
        };
    }
      
    restTrial() {
        return {
            type: htmlKeyboardResponse,
            stimulus: 'Please take a break. The next block will start in 30 seconds.',
            trial_duration: restTrialLength * 1000,
            response_ends_trial: false,
            choices: ["NO_KEYS"],
            on_start: (trial) => {   
                trial.data.experiment = "rest";   
            },      
            on_load: () => {                       
                initHTMLAssets();                        
                document.getElementById("timer").style.display = "block";
                document.getElementById('timer').style.backgroundColor = "#419D78";
                document.getElementById('timer').innerHTML = "00:" + restTrialLength.toString();

                var timerInterval;
                timerInterval = setInterval( () => { runTimer(timerInterval) }, 1000);                   
            },
              
            data: { experiment: 'rest', blockType: BLOCK_TYPE.REST, correct: 'null' }
        }   
    }

    makeTimeline() {
        this._timeline = this._blockOrder.map((blockType, index) => {
            const instr = this.makeInstructionTrial();             
            const trls = this.makeBlockTrials();
            return [instr, ...trls, this.restTrial()];
        });
    }
}
