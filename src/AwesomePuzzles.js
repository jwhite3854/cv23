import { Crossword, CrosswordDOM } from './Crossword.js';


export const AwesomePuzzle = {
    puzzleID: null,
    crossword: null,
    crosswordDom: null,
    currentClue: null,
    cluesAcross: [],
    cluesDown: [],

    play (crosswordID, clues, answers = []) {
        this.puzzleID = crosswordID;
        this.crossword = Crossword.compile(clues);
        this.crosswordDom = CrosswordDOM.generate(this.crossword, document.getElementById(crosswordID));

        this.cluesAcross = this.crossword.acrossClues;
        this.cluesDown = this.crossword.downClues;

        this.crosswordDom.selectClue(this.crossword.clues[0]);
        this.crosswordDom.onStateChanged = (message) => {
            if(message.message === "clueSelected") {
              this.currentClue = this.crosswordDom.currentClue;
            }
        };
    },

    loadProgress() {
        let answers = window.localStorage.getItem('awesome_puzzle_' + this.puzzleID) ?? '';
        if (answers.length > 0) {
            this.crossword.load(JSON.parse(answers));
            this.crosswordDom.destroy();
            this.crosswordDom = CrosswordDOM.generate(this.crossword, document.getElementById(this.puzzleID));
            this.crosswordDom.selectClue(this.crossword.clues[0]);
        }
    },

    saveProgress() {
        let answers = this.crossword.save();
        window.localStorage.setItem('awesome_puzzle_' + this.puzzleID, JSON.stringify(answers));
    },

    isHighlightedClue (clue) {
        const currentClue = this.currentClue;
        const parentClue = currentClue.parentClue;

        // The trivial case is that the clue is selected.
        if (clue === currentClue) {
            return true;
        }

        //  We might also be a clue which is part of a non-linear clue.
        return (currentClue && parentClue && (parentClue === clue || parentClue.connectedClues.indexOf(clue) !== -1));
    },

    selectClue (clue) {
        this.crosswordDom.selectClue(clue);
    }
}