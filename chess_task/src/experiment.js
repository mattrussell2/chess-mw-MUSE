/**
 * @title Chess Playing with Muse
 * @description Chess Playing with Muse
 * @version 0.1.0
 *
 * @assets assets/
 */

import "./main.scss";

import { initJsPsych } from "jspsych";

import fullscreen from '@jspsych/plugin-fullscreen';
import callFunction from '@jspsych/plugin-call-function';
import PreloadPlugin from "@jspsych/plugin-preload";
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import imageKeyboardResponse from '@jspsych/plugin-image-keyboard-response';
import JsPsychExtensionMouseTracking from '@jspsych/extension-mouse-tracking';

import { MuseClient, channelNames } from 'muse-js';
import { runPuzzle, checkSecond } from './runpuzzle.js';
import { Puzzle } from './puzzles.js';
import { ExpData } from './expdata.js';

import { inspect } from 'util';
import stringify from 'json-stable-stringify';
import {v4} from 'uuid';

export var REST_LENGTH; 
export var TRIAL_LENGTH;

export async function run({ assetPaths, input = {}, environment, title, version }) {    
    console.log(performance.timeOrigin);
    const DEMO_MODE = true; //false;
   
    var USE_MUSE;
    var NUM_BLOCKS;
    var TRIALS_PER_BLOCK;

    if (DEMO_MODE) {
        USE_MUSE = true;
        NUM_BLOCKS = 1;
        TRIALS_PER_BLOCK = 5;
        REST_LENGTH = 10;
        TRIAL_LENGTH = 30;
    } else {
        USE_MUSE = true;
        NUM_BLOCKS = 1;
        TRIALS_PER_BLOCK = 30;
        REST_LENGTH = 30;
        TRIAL_LENGTH = 30;
    }

    var museClient;
    var DATA = new ExpData();

    const MAX_RATING = 2550;
    const MIN_RATING = 550;
    const START_RATING = 800;

    const PORT = 8001;
    
    const MATEIN_FILE = './assets/100matein.csv';

    const puzzlefile = await fetch(MATEIN_FILE);
    var puzzles = (await puzzlefile.text()).split('\n');
    puzzles = puzzles.map((p, i) => { 
                                      try {
                                        return new Puzzle(p) 
                                      }catch(e) {
                                        console.log(i, ' is a malformed puzzle');
                                        return null;
                                     }
                                    });
    
    var puzzle_dict = {};
    for (var i = 10; i < 57; i++) {
        let curr_elo = 50 * i;
        puzzle_dict[curr_elo] = puzzles.filter(p => p != null && p.rating >= curr_elo && p.rating <= curr_elo + 50);
    }
    console.log(puzzle_dict)


    const jsPsych = initJsPsych({
        extensions: [
            { type: JsPsychExtensionMouseTracking }
        ]
    });

    jsPsych.data.addProperties( { subject_id: v4().slice(0, 8) } );

    const timeline = [];

    // Preload assets
    timeline.push({
        type: PreloadPlugin,
        images: assetPaths.images,
        audio: assetPaths.audio,
        video: assetPaths.video,
    });

    timeline.push({
        type: fullscreen,
        fullscreen_mode: true
    })
      
    var id =  document.createElement('button');
    id.id = "saveme";
    document.head.appendChild(id);
    
    document.getElementById("saveme").addEventListener("click", async function() {
        console.log("clicked")
        museClient = new MuseClient();
        museClient.enablePpg = true;
        await museClient.connect();
        await museClient.start();   
        DATA.addMuseClient(museClient);  
    });

    if (USE_MUSE) {
        timeline.push({
            type: jsPsychHtmlButtonResponse, 
            button_html: "<button id='hello' onclick=saveme.click() class='jspsych-bntn' style='height:200px;width:200px'></button>",
            stimulus:  "<p>Press button below connect to the Muse Device.</p>",
            choices: ["yes"]
        });
    }

    timeline.push({
        type: htmlKeyboardResponse,
        stimulus: "<p>Please solve these chess puzzles as quickly as possible, without sacrificing accuracy.</br>" + 
                  "Each puzzle is mate-in-X, where X is between 1-6 moves. The program does not allow for premoves, and will always " +
                  "default to a queen if promoting a pawn. <br><br>Feel free to ask your experimenter any questions.</p>",
        choices: ['Enter']
    })

    function initHTMLAssets() {
        
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
    
    var elo;
    
    for (const bNum of [...Array(NUM_BLOCKS).keys()]) {
        const block = {
                timeline: [],
                on_timeline_start: function() {
                    elo = START_RATING; // reset elo to easy level 
                    DATA.injectMuseMarker("STATUS: block_started; BLOCK: " + bNum.toString());
                },
                on_timeline_finish: async function() {
                    DATA.injectMuseMarker("STATUS: block_ended; BLOCK: " + bNum.toString());
                    const save_data = DATA.toJSON();
                    const blob = new Blob([ JSON.stringify(save_data) ]);
                    const result = await fetch( `http://localhost:` + PORT, { method:"POST", body:blob } );
                    console.log('Block ' + bNum.toString() + ' just ended.')
                }
        }

        block.timeline.push({
            type: htmlKeyboardResponse,
            stimulus: 'Please take a break. The next block will start in ' + REST_LENGTH.toString() + ' seconds.',
            choices: ["NO_KEYS"],
            trial_duration: REST_LENGTH * 1000 + 50, // add 50ms to make sure the timer interval is cleared. 
            on_start: () => {
            },
            on_load: () => {
                initHTMLAssets();
                DATA.injectMuseMarker("STATUS: rest_loaded");
                document.getElementById("timer").style.display = "block";
                document.getElementById('timer').style.backgroundColor = "#419D78";
                document.getElementById('timer').innerHTML = "00:" + REST_LENGTH.toString();
                var timerInterval;
                timerInterval = setInterval( () => { checkSecond(null, null, null, timerInterval, 1000, null, true) }, 1000);
            },
            on_finish: (data) => {
                DATA.injectMuseMarker("STATUS: rest_ended"); 
            },
            extensions: [
                { type: JsPsychExtensionMouseTracking }
            ],
        })

        for (const tNum of [...Array(TRIALS_PER_BLOCK).keys()]) {           

            block.timeline.push({
                type: callFunction,
                async: true,
                func: async function(done){
                    initHTMLAssets();
                    let res = await runPuzzle(puzzle_dict, DATA, elo);
                    done(res);
                },
                on_finish: async (data) => {
                    let passed = data['value'];  
                    passed = passed.split(',').at(-2);
                    console.log(passed);
                    elo += passed === "solved?:true" ? 50 : -50;
                    if (elo < MIN_RATING) elo = MIN_RATING;
                    else if (elo > MAX_RATING) elo = MAX_RATING;
                    DATA.injectMuseMarker("STATUS: trial_ended; TRIAL: " + tNum.toString());
                    DATA.addTrialData(data);
                }, 
                extensions: [
                    { type: JsPsychExtensionMouseTracking }
                ],
            })
        }
        
        timeline.push(block);
    }
    
    timeline.push({
        type: htmlKeyboardResponse,
        stimulus: "<p>This block has concluded. Please refresh the page</p>",
        choices: ['Enter']
    })

    await jsPsych.run(timeline);

    return jsPsych;
}
