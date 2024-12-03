/*
 * timer.js 
 * a simple timer
*/

import { restTrialLength } from './taskinfo.js';

var countSec = 0;

export function runTimer(timerInterval) {
    const timer = document.getElementById("timer");
    countSec++;

    if (countSec >= restTrialLength) {
        clearInterval(timerInterval);
        countSec = 0;
        return;
    }

    const timeArray = timer.innerHTML.split(":");

    var m = timeArray[0];
    var s = timeArray[1] - 1;
    var s_num = parseInt(s);

    if (s_num < 10 && s_num >= 0) {s = "0" + s}; 
    timer.innerHTML = m + ":" + s;
}
