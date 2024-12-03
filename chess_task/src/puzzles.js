/*  ****************************************************************************
 * 
 *  File name: puzzles.js
 *  
 *   Note: moves used for chessjs require promotion only when promoting, so 
 *         here no 'get' function exists for promotion - we hack it out by 
 *         converting the Move to an object and adding promotion then. 
 *  ****************************************************************************
 */

export class Move{
    constructor(moveStr) {
        this._moveStr = moveStr;
        this._from = moveStr.substr(0, 2);
        this._to = moveStr.substr(2, 4);
        this._promotion = "q";
    }

    get from() {
        return this._from;
    }

    get to() {
        return this._to;
    }

    get moveStr() {
        return this._moveStr;
    }

    set to(to) {
        this._to = to;
    }

    toObj() {
        return { from: this._from, to: this._to, promotion: this._promotion }
    }

    toString() {
        return this._moveStr;
    }

    valueOf() {
        return this._moveStr;
    }

    equals(otherMove) {
        return this._moveStr === otherMove.moveStr;
    }
};


/*
    Note! Assumes puzzle is a 'mateInX' puzzle
*/
export class Puzzle{
    //puzzleStr
    constructor(puzzleStr){
        this._puzzleStr = puzzleStr;
        this._puzzleAry = this._puzzleStr.split(',');
        this._id = this._puzzleAry[0];
        this._fen = this._puzzleAry[1];
        this._moves = this._puzzleAry[2].split(' ');
        this._moves = this._moves.map((move) => new Move(move))
        this._rating = this._puzzleAry[3];
        this._ratingDeviation = this._puzzleAry[4];
        this._popularity = this._puzzleAry[5];
        this._nbplays = this._puzzleAry[6];
        this._themes = this._puzzleAry[7];
        this._theme = this._themes.split(' ').filter(t => t.includes("mateIn"))[0];
        this._gameurl = this._puzzleAry[8];
        this._openingfamily = this._puzzleAry[9];
        this._openingvariation = this._puzzleAry[10];
        this._solved = null;
        this._failedOn = -1;
        this._timedOut = false;
    }

    get startStr() {
        return this._puzzleStr;
    }

    get moves() {
        return this._moves;
    }
    
    get fen() {
        return this._fen;
    }

    get rating() {
        return this._rating;
    }

    get theme() {
        return this._theme;
    }

    get solved() {
        return this._solved;
    }

    get timedOut() {
        return this._timedOut;
    }

    get failedOn() {
        return this._failedOn;
    }

    set solved(val) {
        this._solved = val;
    }

    set failedOn(val) {
        this._failedOn = val;
    }

    set timedOut(val) {
        this._timedOut = val;
    }

    toString() {
        return this._puzzleStr + ',timedOut?:' + this._timedOut + ',solved?:' + this._solved + ',failed_on_move?:' + this._failedOn;
    }
};
 