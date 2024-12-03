/*  ****************************************************************************
 * 
 *  File name: index.js
 *  Purpose: runs the command loop, serves as 'main'
 *  
 *  ****************************************************************************
 */
//npx patch-package muse-js --create-issue
/* 
    NOTE! promotion defaults to queen. 
*/
// const MINUTES = 5;
// const SECONDS = 0;
const whiteSquareGrey = '#a9a9a9';
const blackSquareGrey = '#696969';
const RED = '#FF0000';
const GREEN = '#90EE90';

import { Chess } from 'chess.js';

import './chessboard-1.0.0.css';
import { Chessboard } from './chessboard-1.0.0.js';
import { Move } from './puzzles.js';
import { REST_LENGTH, TRIAL_LENGTH } from './experiment.js';

var countSec = 0;

import $ from 'jQuery';

export async function runPuzzle(puzzles, DATA, elo) {
    return new Promise((resolve, reject) => {
        console.log("ELO", elo);
    
        document.getElementById("board").style.display = "block";
        document.getElementById("status").style.display = "block";
        document.getElementById("timer").style.display = "block";
        document.getElementById('timer').style.backgroundColor = "#419D78";
        document.getElementById('timer').innerHTML = "00:" + TRIAL_LENGTH.toString();
       
        /* initializing puzzles */
        let possible_puzzles = puzzles[elo];
        let puzzle = possible_puzzles[Math.floor(Math.random() * possible_puzzles.length)];
        while (puzzle.solved !== null) {
            puzzle = possible_puzzles[Math.floor(Math.random() * possible_puzzles.length)];
        }
        console.log(puzzle.moves);
        console.log(puzzle.toString());

        let TIMEOUT = 1000;
 
        let config = {
            draggable: true,
            position: puzzle.fen,
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            onMouseoutSquare: onMouseoutSquare,
            onMouseoverSquare: onMouseoverSquare
        };
        
        let move_counter = 0;
        let $status = $('#status');
        
        let game = new Chess(puzzle.fen);
        let board = new Chessboard('board', config);
        board.orientation(game.turn() == 'w' ? 'black' : 'white');

        // puzzle is now visible
        DATA.injectMuseMarker("STATUS: puzzle_loaded; ELO: " + elo.toString() + "; PUZZLESTR: " + puzzle.startStr);

        window.setTimeout(opposition_move, TIMEOUT, puzzle.moves[move_counter]);
        
        var timerInterval;
        timerInterval = setInterval( () => { 
                                            checkSecond(DATA, puzzle, resolve, timerInterval, TIMEOUT, board, false)
                                           }, 1000);
        function opposition_move(move) {
            if (!game.isGameOver()) {

                // fix promotion bug - we're still assuming queen promotion but whatever for now. 
                if (move.to[move.to.length - 1] == 'q') {
                    move.to = move.to.slice(0, -1); 
                    move = move.toObj();
                }
                game.move(move);
                // removing sounds for now - particularly because this one bugs out sometimes. 
                // if (game.history({verbose: true})[game.history().length - 1].hasOwnProperty('captured')) {
                //     playCaptureSound();
                // }else {
                //     playMoveSound();
                // }
                board.position(game.fen()); 
                move_counter++;
                updateStatus();
                DATA.injectMuseMarker("STATUS: opponent_moved; FEN: " + game.fen());
            }
        }

        function onDragStart (source, piece, position, orientation) {
            // do not pick up pieces if the game is over
            if (game.isGameOver()) return false;

            // only pick up pieces for the side to move
            if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
                DATA.injectMuseMarker("STATUS: piece_drag_start; PIECE: " + piece + "; SOURCE: " + source + "; ORIENTATION: " + orientation + "; INFO: wrong_side");
                return false;
            }

            DATA.injectMuseMarker("STATUS: piece_drag_start; PIECE: " + piece + "; SOURCE: " + source + "; ORIENTATION: " + orientation);
        }

        function makeMoveString(status, src, target, move_counter, fen, result=null) {
            return "STATUS: " + status + (result != null ? "; RESULT: " + result : "") + "; SOURCE: " + src + "; TARGET: " + target + "; MOVE_NUM: " + move_counter.toString() +  "; FEN: " + fen + "; ELO: " + elo.toString(); 
        }

        function onDrop (source, target) {
            removeGreySquares();

            let actualMove = puzzle.moves[move_counter];
            let move = new Move(source + target);
            if (move.from == actualMove.from && actualMove.to == (move.to + 'q')) {
                move = {from: move.from, to: move.to, promotion: 'q'};
            }
            let result = game.move(move); 

            /* illegal move */
            if (result === null) {
                // careful with this - passing a move counter, but the move isn't actually made.  
                DATA.injectMuseMarker(makeMoveString("illegal_move", source, target, move_counter, game.fen(), result="snapback"));
                return 'snapback';
            }

            if (game.isGameOver() && !puzzle.timedOut) {
                DATA.injectMuseMarker(makeMoveString("puzzle_finished", source, target, move_counter, game.fen(), result="solved")); 
                moveColor(target, GREEN);
                puzzle.solved = true;
                //playCheckMateSound();
                clearInterval(timerInterval);
                countSec = 0; 
                updateStatus();
                window.setTimeout(resolve, TIMEOUT, puzzle.toString());
                return;
            }
            // remove sound for now. 
            // else {
            //     if (game.history({verbose: true})[game.history().length - 1].hasOwnProperty('captured')) {
            //         DATA.injectMuseMarker(makeMoveString(source, target, move_counter, "captured piece"));
            //         playCaptureSound();
            //     }else {
            //         playMoveSound();
            //     }
            // }

            /* incorrect move */
            if (!move.equals(actualMove) && !puzzle.timedOut) {
                DATA.injectMuseMarker(makeMoveString("puzzle_finished", source, target, move_counter, game.fen(), result="failed"));
                moveColor(target, RED);
                puzzle.solved = false;
                puzzle.failedOn = move_counter; // opponent moves first
                clearInterval(timerInterval);
                countSec = 0;
                updateStatus();
                window.setTimeout(resolve, TIMEOUT, puzzle.toString()); // one second delay
                return;
            }

            /* 
                puzzle has been solved correctly, but not by a checkmate. 
                our current study will never go inside this loop, b/c all the puzzles are mate-in-x. 
            */
            if ((move_counter == puzzle.moves.length - 1) && !puzzle.timedOut) {
                DATA.injectMuseMarker(makeMoveString("puzzle_finished", source, target, move_counter, game.fen(), result="solved"));
                moveColor(target, GREEN);
                puzzle.solved = true;
                clearInterval(timerInterval);
                countSec = 0;
                updateStatus();
                window.setTimeout(resolve, TIMEOUT, puzzle.toString());
                return;
            }
            
            /* move is correct, but puzzle not done */
            const capture = game.history({verbose: true})[game.history().length - 1].hasOwnProperty('captured')

            DATA.injectMuseMarker(makeMoveString("correct_move", source, target, move_counter, game.fen(), result=capture ? "capture" : "move"));
            
            updateStatus();
            
            move_counter++;
            
            /* move is correct */
            moveColor(target, GREEN);
            window.setTimeout(opposition_move, TIMEOUT, puzzle.moves[move_counter]);
            updateStatus();
        }

        /* update the board position after the piece snap
        for castling, en passant, pawn promotion */
        function onSnapEnd () {
            board.position(game.fen());
        }

        function updateStatus () {
            let status = '';
            let moveColor = game.turn() == 'b' ? 'Black' : 'White';

            if (game.isCheckmate()) { status = 'Game over, ' + moveColor + ' is in checkmate.' }
            else if (game.isDraw()) { status = 'Game over, drawn position' }

            // game still on
            else {
                status = moveColor + ' to move'
                if (game.inCheck()) {
                    status += ', ' + moveColor + ' is in check'
                }
            }
            
            $status.html(status)
        }

        updateStatus();

        // no sound for now. 
        // function playMoveSound() {
        //     document.getElementById("move").play() 
        // }

        // function playCaptureSound() {
        //     document.getElementById('capture').play();
        // }

        // function playCheckMateSound() {
        //     document.getElementById("checkmate").play(); 
        // }

        /* highlighting legal moves for the current piece */
        function onMouseoverSquare (square, piece) {
            DATA.injectMuseMarker("STATUS: mouseover; SQUARE: " + square + "; PIECE: " + piece);

            // get list of possible moves for this square
            const poss_moves = game.moves({
                square: square,
                verbose: true
            });

            // exit if there are no moves available for this square
            if (poss_moves.length === 0) return;

            // highlight the square they moused over
            greySquare(square);

            // highlight the possible squares for this piece
            for (var i = 0; i < poss_moves.length; i++) {
                greySquare(poss_moves[i].to);
            }
        }

        /* if the mouse leaves the square */
        function onMouseoutSquare (square, piece) {
            DATA.injectMuseMarker("STATUS: mouseout; SQUARE: " + square + " PIECE: " + piece);
            removeGreySquares();
        }

        /* removing possible moves after the move is played */
        function removeGreySquares () {
            $('#board .square-55d63').css('background', '');
        }

        /* greying the square */
        function greySquare (square) {
            const $square = $('#board .square-' + square);
            const background = $square.hasClass('black-3c85d') ? blackSquareGrey : whiteSquareGrey; 
            $square.css('background', background)
        }

        function moveColor(square, color) {
            const $square = $('#board .square-' + square);
            $square.css('background', color);
        }
    });
}

export function checkSecond(DATA, puzzle, resolve, timerInterval, TIMEOUT, board, isRest) {
    const timer = document.getElementById("timer");
    countSec++;

    if (isRest && countSec >= REST_LENGTH) {
        timer.style.backgroundColor = 'red';
        clearInterval(timerInterval);
        countSec = 0;
        return;
    }

    if (!isRest && (countSec >= TRIAL_LENGTH && puzzle.solved === null)) {
        board.draggable = false;
        clearInterval(timerInterval);
        DATA.injectMuseMarker("STATUS: puzzle_finished; RESULT: timeout");
        puzzle.solved = false;
        puzzle.timedOut = true;
        timer.style.backgroundColor = 'red';
        window.setTimeout(() => {
                                    timer.style.display = "none";
                                    board.destroy();    
                                    resolve(puzzle.toString());
                                },
                          TIMEOUT);
        countSec = 0;
        console.log("TIMEOUT");
        return;
    }

    const timeArray = timer.innerHTML.split(":");

    var m = timeArray[0];
    var s = timeArray[1] - 1;
    var s_num = parseInt(s);

    if (s_num < 10 && s_num >= 0) {s = "0" + s}; 
    timer.innerHTML = m + ":" + s;
}
