/**
 * @title experiment.js
 * @version 1.0.0
 * @description Abstracted experiment which can run any of the three tasks: nback, rotation, stroop.
*/

import "./main.scss";

import { v4 } from 'uuid';
import { initJsPsych } from "jspsych";
import { MuseClient } from 'muse-js';
import { ExpData } from './expdata.js';
import { RotationTask } from './rotation.js';
import { NBackTask } from './nback.js';
import { StroopTask } from './stroop.js';
import { BLOCK_TYPE } from "./taskinfo.js";
import { TaskInfo } from "./taskinfo.js";
import fullscreen from '@jspsych/plugin-fullscreen';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychCallFunction from '@jspsych/plugin-call-function';

export async function run({ assetPaths, input = {}, environment, title, version }) {    

    var MUSE_VALID  = null;

    const TASKNAME  = TaskInfo.TASK_TO_RUN;
    const BLOCKTYPE = TaskInfo.BLOCK_TYPE;
    const NTRIALS   = BLOCKTYPE == BLOCK_TYPE.PRACTICE ? TaskInfo.NPRACTICE_TRIALS[TASKNAME] : 
                                                         TaskInfo.NTRIALS_PER_BLOCK[TASKNAME];    
    const NBLOCKS   = TaskInfo.NBLOCKS_PER_TASK[BLOCKTYPE][TASKNAME];
    var DATA        = new ExpData();

    const jsPsych = initJsPsych({
        on_trial_start: (trial) => {            
            DATA.injectMuseMarker("STATUS: trial_loaded; TRIAL_TYPE: " + trial.data.experiment + "; BLOCK_TYPE: " + trial.data.blockType);
        }, 
        on_trial_finish: (trial) => {       
            console.log(trial);                
            trial.correct = trial.correct;
            DATA.injectMuseMarker("STATUS: trial_finished; TRIAL_TYPE: " + trial.experiment +
                                  "; CORRECT: " + trial.correct + "; BLOCK_TYPE: " + trial.blockType);
            DATA.addTrialData(trial);
        }
    });  
    
    jsPsych.data.addProperties( { subject_id: v4().slice(0,8) } ); //userid    
    
    const taskParams = [TASKNAME, BLOCKTYPE, NBLOCKS, NTRIALS, jsPsych];

    const TASK = TASKNAME == 'nback' ? new NBackTask(...taskParams) :
                 TASKNAME == 'rotation' ? new RotationTask(...taskParams) :
                 TASKNAME == 'stroop' ? new StroopTask(...taskParams) : null;

    function makeBlock(i) {
        return {
            timeline: TASK.timeline[i],
            on_timeline_start: function() {
                DATA.injectMuseMarker("STATUS: block_started; TASK_NAME: " + TASKNAME + "; BLOCK_TYPE: " + BLOCKTYPE);
            },
            on_timeline_finish: async function() {
                DATA.injectMuseMarker("STATUS: block_ended; TASK_NAME: " + TASKNAME + "; BLOCK_TYPE: " + BLOCKTYPE); 
                await DATA.exportDATA();
            }, 
            loop_function: function(data) {
                if (BLOCKTYPE === BLOCK_TYPE.PRACTICE) {
                    const currTrials = data.values();
                    return jsPsych.pluginAPI.compareKeys(currTrials[currTrials.length - 1].response, 'r');
                }
                return false;
            }
        }
    }

    // Used to connect to the Muse device and start streaming data; 'fake' button that is clicked.
    var museClient;    
    var museButton = document.createElement('button');
    museButton.id = "saveme";
    museButton.addEventListener("click", 
                                async function() {
                                                    museClient = new MuseClient();
                                                    museClient.enablePpg = true;
                                                    try {
                                                        await museClient.connect();
                                                        await museClient.start();
                                                        DATA.addMuseClient(museClient);
                                                        MUSE_VALID = true;
                                                    } catch (err) {
                                                        console.log(err);
                                                        MUSE_VALID = false;
                                                    }                
                                                    console.log("connected");
                                                });
    document.head.appendChild(museButton);

    var timeline = [];

    timeline.push({
        type: fullscreen,
        fullscreen_mode: true,
        data: { experiment: 'fullscreen', blockType: BLOCK_TYPE.OTHER, correct: 'null' }
    });
    
    timeline.push({
        type: jsPsychHtmlButtonResponse, 
        button_html: "<button id='hello' onclick=saveme.click() class='jspsych-bntn' style='height:100px;width:100px'></button>",
        stimulus:  "<p>Press button below connect to the Muse Device.</p>",
        choices: ["yes"],
        data: { experiment: 'connectMuse', blockType: BLOCK_TYPE.OTHER, correct: 'null' }
    });

    timeline.push({
        type: htmlKeyboardResponse, 
        stimulus: "<p>Press Enter to continue.</p>",
        choices: ["Enter"],
        data: { experiment: 'pressEnter', blockType: BLOCK_TYPE.OTHER, correct: 'null' }
    })   
                
    for (let i = 0; i < NBLOCKS; i++) {        
        timeline.push(makeBlock(i));       
    }
    
    await jsPsych.run(timeline);
    return jsPsych;
}
