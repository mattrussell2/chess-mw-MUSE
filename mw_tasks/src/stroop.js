import { Task } from './task.js'
import { BLOCK_TYPE } from './taskinfo.js'

const STROOP_COLORS = [ 'red', 'green', 'blue', 'yellow' ];

export class StroopTask extends Task {
    constructor(name, blockType, numBlocks, trialsPerBlock, jsPsych) {
        super(name, blockType, numBlocks, trialsPerBlock, jsPsych);

        this._blockOrder = Array(numBlocks).fill(blockType);
                
        // jspsych trial options
        this._choices = [ 'r', 'g', 'b', 'y' ];
        this._trial_duration = 2000;
        this._stimulus_duration = null;

        this.makeTimeline();
    }

    makeBlockTrials() {         
        let blockTrials = [];
        for (let trial = 0; trial < this._trialsPerBlock; trial++) {                       
            var [colorDraw, colorIgnore] = this._jsPsych.randomization.sampleWithoutReplacement(STROOP_COLORS, 2);
            if (Math.random() < 0.5) colorIgnore = colorDraw;
            const htmlTextColor = colorDraw === 'yellow' ? 'gold' : colorDraw; // html yellow looks hideous
            const stimulus = '<p style="font-size:50px;color: ' + htmlTextColor + ';">' + colorIgnore + '</p>';
            blockTrials.push(this.makeTrial({
                choices: this._choices,
                duration: this._trial_duration,
                stimulus: stimulus,
                data: { 
                        colorDraw: colorDraw, 
                        colorIgnore: colorIgnore, 
                        congruent: colorDraw == colorIgnore, 
                        blockType: this.blockType,
                        experiment: "stroop"
                    }
                })
            );
        }
        return blockTrials.flat();        
    }
    
    instructions() {
        const title = "<h1>Stroop Task</h1>";
        const body = "<br>In this experiment you will be presented with a series of words. <br> Each word will be one of the words blue, red, yellow and green, and will also be written in one of those colors.<br>As soon as you see a new word, press the keyboard key of the first letter of the <b>color</b> of the word.<br>For example, if you see the word<p> <p style='color:blue;font-size:30px;'>red<p><p> you would press the <b>b</b> key, because the word's color is blue.<br>Try to answer as quickly as you can!"
        return title + body;
    }
   
    correct(data) {
        return data.response === data.colorDraw[0];
    }

}