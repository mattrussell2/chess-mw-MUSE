/* 
 * taskinfo.js
 * effectively a config file used by the server to know:
 *             which task to run, and whether it's instruction or 'real'
 * you can also adjust various parameters of the experimental design here (e.g. number of trials per block)
*/

export const BLOCK_TYPE = {
    TASK: 'task',
    PRACTICE: 'practice',
    TASK_INSTRUCTION: 'instruction',
    PRACTICE_INSTRUCTION: 'practice_instruction',
    REST: 'rest', 
    OTHER: 'other'
}

// EDIT THESE BETWEEN EACH TASK
const TASK_TO_RUN = 'nback';  // 'stroop', 'nback', or 'rotation'
const TASK_TYPE = BLOCK_TYPE.TASK; // BLOCK_TYPE.PRACTICE or BLOCK_TYPE.TASK

export const restTrialLength = 30;

export const TaskInfo = {
    TASK_TO_RUN: TASK_TO_RUN,
    BLOCK_TYPE: TASK_TYPE,
    NBLOCKS_PER_TASK: {        
            [BLOCK_TYPE.PRACTICE]: {
                stroop: 1,
                nback: 4,
                rotation: 1
            },
            [BLOCK_TYPE.TASK]: {
                stroop: 1,
                nback: 4,
                rotation: 1
            }        
    },

    NTRIALS_PER_BLOCK: {
        stroop: 75, 
        nback: 25,
        rotation: 24
    },

    NPRACTICE_TRIALS: {
        stroop: 12,
        nback: 12,
        rotation: 12
    }
}

    
export function initHTMLAssets() {              
    if (document.getElementById("status") == null) {
        var s = document.createElement('label');
        s.id = "status";
        s.innerText = "Status:";
        document.getElementById("jspsych-content").append(s);
        console.log(document.getElementById("jspsych-content"))
    }
    if (document.getElementById("board") == null) {
        var b = document.createElement('div');
        b.id  = "board";
        b.class = "board";
        b.style ="width: 650px";
        document.getElementById("jspsych-content").append(b);
    }
    if (document.getElementById("timer") == null) {
        const timer = document.createElement("div");
        timer.id = "timer";
        document.getElementById("jspsych-content").append(timer);
    }
}         
// this will always be the same, because it depends on the tasks themselves ....
//const NBLOCKS = { 'stroop': 2, 'nback': 12, 'rotation': 2 };
