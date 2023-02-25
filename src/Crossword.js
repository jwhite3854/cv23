
function Cell(opts = {}) {
    this.label = opts.label ?? false;
    this.answer = String(opts.answer ?? "").toUpperCase();
    this.value = "";
    this.is_clue = (this.answer !== "");

    this.codes = false;
    let clueCode = opts.code ?? false;
    if (clueCode) {
        this.codes = {};
        this.codes[clueCode] = 1;
    }
    
    this.x = opts.x ?? 1;
    this.y = opts.y ?? 1;
}

function Clue(opts = {}, is_across = true) {

    this.number = opts.number ?? 1;
    this.is_across = is_across;
    this.code = this.number + (this.is_across ? 'a' : 'd');

    this.answerText = opts.answer ?? "";
    this.clueText = opts.text ?? "";

    this.x = opts.x ?? 1;
    this.y = opts.y ?? 1;
}

const CellsElementsMap = {
    map: {},

    setWidth(width) {
        for (let ii = 1; ii <= width; ii++) {
            this.map[ii] = {};
        }
    },

    setHeight(col, height) {
        for (let ii = 1; ii <= height; ii++) {
            this.map[col][ii] = {
                cell: new Cell({x: col, y: ii}),
                element: null
            };
        }
    },

    setCell(crossCell) {
        if (!this.map[crossCell.x][crossCell.y].cell.is_clue) {
            this.map[crossCell.x][crossCell.y].cell = crossCell;
            return;
        }

        if (crossCell.label) {
            this.map[crossCell.x][crossCell.y].cell.label = crossCell.label;
        }

        if (crossCell.codes) {
            let clueCode = Object.keys(crossCell.codes)[0];
            this.map[crossCell.x][crossCell.y].cell.codes[clueCode] = 1;
        }
    },

    setElement(coords, element) {
        this.map[coords.x][coords.y].element = element;
    },

    getElement(cell) {
        return this.map[cell.x][cell.y].element;
    },

    getCell(element) {
        if (element.hasOwnProperty('x') && element.hasOwnProperty('y')) {
            return this.map[element.x][element.y].cell;
        }

        let coords = element.getAttribute('id').split('_');

        return this.map[coords[1]][coords[2]].cell;
    },

    setCellValue(element, value) {
        let cell = this.getCell(element);
        this.map[cell.x][cell.y].cell.value = value;
    },

    clearCellValues() {
        for (let ii = 0; ii < Object.keys(this.map).length; ii++) {
            for (let jj = 0; jj < Object.keys(this.map[ii]).length; jj++) {
                this.map[ii][jj].cell.value = "";
            }
        }
    },

    generateCellElement(x, y) {
        let cell = this.map[x][y].cell;
        let element = document.createElement('div');
        element.className = 'cwcell';
        element.setAttribute('id', 'cwcell_' + x + '_' + y)
    
        if (cell.label) {
            let cellLabel = document.createElement('label');
            cellLabel.innerText = cell.label;
            element.appendChild(cellLabel);
        }
    
        if (!cell.is_clue) {
            this.setElement({x: x, y: y}, element);
            return element;
        }
    
        const inputElement = document.createElement('input');
        inputElement.maxLength = 1;
        inputElement.value = cell.value;
        element.className = 'cwcell clued';
        
        inputElement.addEventListener('focus', (event) => {
            const cell = CellsElementsMap.getCell(event.target.parentElement);
            if (Object.keys(cell.codes).length === 1 && cell.codes.hasOwnProperty(CrosswordDOM.selectedClue.code)) {
                return;
            }
          
            CrosswordDOM.updateSelectedClue(cell.codes);
        }); 
    
        inputElement.addEventListener('keydown', (event) => {
            event.preventDefault();

             if (event.code.toUpperCase() === 'BACKSPACE') {
                event.target.value = "";
                CellsElementsMap.setCellValue(event.target.parentElement, "");
                CrosswordDOM.erase(event.target.parentElement);
            }

            if (event.code.length === 4 && event.code.substring(0, 3) === 'Key') {
                event.target.value = String(event.key).toUpperCase();
                CellsElementsMap.setCellValue(event.target.parentElement, event.target.value);
                CrosswordDOM.advance(event.target.parentElement);
                return;
            }
    
            switch (event.key) {   
                case 'ArrowUp':
                case 'ArrowDown':
                    CrosswordDOM.moveY(element, (event.key === 'ArrowDown'));
                    return;
                case 'ArrowRight':
                case 'ArrowLeft':
                    CrosswordDOM.moveX(element, (event.key === 'ArrowRight'));
                    return;
            }
        }); 
    
        inputElement.addEventListener('keyup', (event) => {
            event.preventDefault();
            if (event.code.length === 4 && event.code.substring(0, 3) === 'Key') {
            //    CrosswordDOM.advance(element);
            }
        });
    
        element.appendChild(inputElement);
        this.setElement({x: x, y: y}, element);

        return element;
    }
}



export const Crossword = {

    width: null,
    height: null,
    clues: [],

    compile(clues) {
        this._buildCellArray(clues.width, clues.height);

        for (let ii = 0; ii < clues.across.length; ii++) {
            let clue = new Clue(clues.across[ii]);
            this.clues.push(clue);

            let label = String(clue.number);
            for (let jj = 0, clueX = clue.x; jj < clue.answerText.length; jj++, clueX++) {
                let cell = new Cell({answer: clue.answerText[jj], x: clueX, y: clue.y, label: label, code: clue.code});
                CellsElementsMap.setCell(cell);
                label = null;
            }
            
        }

        for (let ii = 0; ii < clues.down.length; ii++) {
            let clue = new Clue(clues.down[ii], false);
            this.clues.push(clue);

            let label = String(clue.number);
            for (let jj = 0, clueY = clue.y; jj < clue.answerText.length; jj++, clueY++) {
                let cell = new Cell({answer: clue.answerText[jj], x: clue.x, y: clueY, label: label, code: clue.code});
                CellsElementsMap.setCell(cell);
                label = null;
            }
        }

        return this;
    },

    load(answers) {
        for (let [position, value] of Object.entries(answers)) {
            let coords = position.split('_');
            CellsElementsMap.setCellValue({x: coords[0], y: coords[1]}, value);
        }
    },

    save() {
        let answers = {};
        for (let ii = 1; ii <= this.width; ii++) {
            for (let jj = 1; jj <= this.height; jj++) {
                let cell = CellsElementsMap.getCell({x: ii, y: jj});
                if (cell.is_clue) {
                    let position = ii + '_' + jj;
                    answers[position] = cell.value;
                }
            }
        }

        return answers;
    },

    _buildCellArray(width, height) {
        CellsElementsMap.setWidth(width);
        this.width = width;
        this.height = height;
        for (let ii = 1; ii <= this.width; ii++) {
            CellsElementsMap.setHeight(ii, height);
        }
    },
}

export const CrosswordDOM = {
    crossword: null,
   // width: null,
   // height: null,
   // clues: [],
   // cells: [],

    container: null,
    selectedClue: null,

    generate(crossword, parentElement) {
        this.crossword = crossword;
        this.container = document.createElement('div');
        this.container.className = 'crossword';

        for (let ii = 1; ii <= crossword.height; ii++) {
            let row = document.createElement('div');
            row.className = 'cwrow';
            for (let jj = 1; jj <= crossword.width; jj++) {        
                let element = CellsElementsMap.generateCellElement(jj, ii);
                row.appendChild(element);
            }
            this.container.appendChild(row);
        }

        parentElement.appendChild(this.container);
            
        return this;
    },

    selectClue(clue) {
        this.selectedClue = clue;
        this.updateDOM();
        let element =  CellsElementsMap.getElement({x: clue.x, y: clue.y});
        if (element !== null) {
            element.querySelector('input').focus();
        }
    },

    updateSelectedClue(clueCodes) {
        for (let ii = 0; ii <this.crossword.clues.length; ii++) {
            if (clueCodes.hasOwnProperty(this.crossword.clues[ii].code)) {
                this.selectedClue = this.crossword.clues[ii];
                this.updateDOM();
                return;
            }
        }
    },

    moveX(cellEl, is_inc = true) {
        let cell = CellsElementsMap.getCell(cellEl);
        let x = cell.x;
        let y = cell.y;
        if (is_inc) {
            x++;
        } else {
            x--;
        }

        if (x < 1) {
            x = this.crossword.width;
        } else if (x > this.crossword.width) {
            x = 1;
            y++;
        }

        if (y > this.crossword.height) {
            y = 1;
        }

        let nextCellEl = CellsElementsMap.getElement({x: x, y: y});
        let nextCell = CellsElementsMap.getCell(nextCellEl);
        if (nextCell.is_clue) {
            nextCellEl.querySelector('input').focus().value = "";
        } else {
            this.moveX(nextCellEl, is_inc);
        }
    },

    moveY(cellEl, is_inc = true) {
        let cell = CellsElementsMap.getCell(cellEl);
        let x = cell.x;
        let y = cell.y;
        if (is_inc) {
            y++;
        } else {
            y--;
        }

        if (y < 1) {
            y = this.crossword.height;
        } else if (y > this.crossword.height) {
            y = 1;
            x++;
        }

        if (x > this.crossword.width) {
            x = 1;
        }

        
        let nextCellEl = CellsElementsMap.getElement({x: x, y: y});
        let nextCell = CellsElementsMap.getCell(nextCellEl);
        if (nextCell.is_clue) {
            nextCellEl.querySelector('input').focus().value = "";
        } else {
            this.moveY(nextCellEl, is_inc);
        }
    },

    advance(cellEl) {
        if (this.selectedClue.code.slice(-1) === 'a') {
            this.moveX(cellEl);
        } else {
            this.moveY(cellEl);
        }
    },

    erase(cellEl) {
        if (this.selectedClue.code.slice(-1) === 'a') {
            this.moveX(cellEl, false);
        } else {
            this.moveY(cellEl, false);
        }
    },

    updateDOM() {
        this.container.querySelectorAll('.active').forEach((cell) => {
            cell.classList.remove('active');
        })

        let cellX = this.selectedClue.x;
        let cellY = this.selectedClue.y;
        for (let ii = 0; ii < this.selectedClue.answerText.length; ii++) {
            let cellEl = CellsElementsMap.getElement({x: cellX, y: cellY});
            cellEl.classList.add('active');
            if (this.selectedClue.is_across) {
                cellX++;
            } else {
                cellY++;
            }
        }
    },

    destroy() {
        this.container.remove();
    }
}

