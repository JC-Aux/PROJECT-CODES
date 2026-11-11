/*
====================================================
OMR LAYOUT
Single source of truth for answer-sheet geometry.

All values are in millimetres. Positions are measured
from the top-left corner of ONE template (one answer
sheet). The sheet renderer draws from these numbers,
and the scanner will read bubbles from the same numbers.

If you change a value here, re-print and re-test:
the printed sheet and the scanner both change with it.
====================================================
*/

const OMRLayout = (() => {

    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";


    const PAPER = {
        letter: { w: 215.9, h: 279.4, label: "Letter", code: "LT" },
        long:   { w: 215.9, h: 330.2, label: "Long",   code: "LG" }
    };


    /* Maximum answer choices per templates-per-page setting */
    const MAX_CHOICES = {
        1: 6,
        2: 6,
        4: 4
    };


    const G = {

        /* Registration marks: solid squares, one per corner */
        markSize: 5,
        markInset: 7,          // template edge to outer edge of mark

        /* Orientation dot: small square to the right of the
           top-left mark. Lets the scanner tell if the sheet
           is upside down. */
        dotSize: 3,
        dotOffsetX: 8,         // from top-left mark centre

        /* Header text positions (baselines) */
        titleY: 11.2,
        titleFont: 3.2,
        field1Y: 18,
        field2Y: 23.2,
        fieldFont: 2.4,
        instructionY: 26.4,
        instructionFont: 1.9,

        /* Answer grid */
        gridTop: 28,
        rowPitch: 4.8,         // vertical distance between rows
        choicePitch: 5.8,      // horizontal distance between bubbles
        bubbleDiameter: 3.8,
        numberWidth: 7,        // space for the question number
        numberFont: 2.6,
        letterFont: 2,
        columnGap: 10,
        maxRowsPerColumn: 25,
        bottomClearance: 2,    // gap between grid and bottom marks

        footerFont: 1.9
    };


    function round(value) {
        return Math.round(value * 100) / 100;
    }


    function fail(message) {
        return { ok: false, error: message };
    }


    function maxChoices(templatesPerPage) {
        return MAX_CHOICES[templatesPerPage] || 4;
    }


    function compute(config) {

        const questionCount = Number(config.questionCount);
        const choiceCount = Number(config.choiceCount);
        const templatesPerPage = Number(config.templatesPerPage);
        const paper = PAPER[config.paperSize];


        if (!paper) {
            return fail("Unknown paper size.");
        }

        if (![1, 2, 4].includes(templatesPerPage)) {
            return fail("Templates per page must be 1, 2 or 4.");
        }

        if (choiceCount < 2 || choiceCount > maxChoices(templatesPerPage)) {
            return fail(
                `${templatesPerPage}-per-page sheets support choices up to ` +
                `${LETTERS[maxChoices(templatesPerPage) - 1]} only.`
            );
        }


        /* ---------- Template size and positions ---------- */

        const templateW = templatesPerPage === 1 ? paper.w : paper.w / 2;
        const templateH = templatesPerPage === 4 ? paper.h / 2 : paper.h;

        const templates = [];

        if (templatesPerPage === 1) {
            templates.push({ x: 0, y: 0 });
        }

        if (templatesPerPage === 2) {
            templates.push({ x: 0, y: 0 }, { x: templateW, y: 0 });
        }

        if (templatesPerPage === 4) {
            templates.push(
                { x: 0, y: 0 },
                { x: templateW, y: 0 },
                { x: 0, y: templateH },
                { x: templateW, y: templateH }
            );
        }


        const cutLines = [];

        if (templatesPerPage >= 2) {
            cutLines.push({ x1: paper.w / 2, y1: 0, x2: paper.w / 2, y2: paper.h });
        }

        if (templatesPerPage === 4) {
            cutLines.push({ x1: 0, y1: paper.h / 2, x2: paper.w, y2: paper.h / 2 });
        }


        /* ---------- Registration marks (centres) ---------- */

        const half = G.markSize / 2;
        const c = G.markInset + half;

        const marks = {
            tl: { x: round(c),             y: round(c) },
            tr: { x: round(templateW - c), y: round(c) },
            bl: { x: round(c),             y: round(templateH - c) },
            br: { x: round(templateW - c), y: round(templateH - c) }
        };

        const spanW = marks.tr.x - marks.tl.x;
        const spanH = marks.bl.y - marks.tl.y;


        /* ---------- Grid size and fit checks ---------- */

        const columns = Math.ceil(questionCount / G.maxRowsPerColumn);
        const rows = Math.ceil(questionCount / columns);

        const columnWidth =
            G.numberWidth +
            (choiceCount - 1) * G.choicePitch +
            G.bubbleDiameter;

        const gridWidth =
            columns * columnWidth +
            (columns - 1) * G.columnGap;

        const contentWidth = templateW - 2 * G.markInset;

        if (gridWidth > contentWidth) {
            return fail(
                `${questionCount} items with ${choiceCount} choices are too wide ` +
                `for ${templatesPerPage} templates per page.`
            );
        }

        const gridBottom = G.gridTop + rows * G.rowPitch;
        const gridLimit = marks.bl.y - half - G.bottomClearance;

        if (gridBottom > gridLimit) {
            return fail(
                `${questionCount} items do not fit on a ${templatesPerPage}-per-page ` +
                `${paper.label} sheet. Use Long paper or fewer templates per page.`
            );
        }

        const gridLeft = (templateW - gridWidth) / 2;


        /* ---------- Question numbers and bubbles ---------- */

        const numbers = [];
        const bubbles = [];

        for (let col = 0; col < columns; col++) {

            const colX = gridLeft + col * (columnWidth + G.columnGap);

            for (let row = 0; row < rows; row++) {

                const question = col * rows + row + 1;

                if (question > questionCount) {
                    break;
                }

                const y = G.gridTop + (row + 0.5) * G.rowPitch;

                numbers.push({
                    question,
                    x: round(colX + G.numberWidth - 1.2),
                    y: round(y)
                });

                for (let k = 0; k < choiceCount; k++) {

                    const x =
                        colX +
                        G.numberWidth +
                        G.bubbleDiameter / 2 +
                        k * G.choicePitch;

                    bubbles.push({
                        question,
                        choice: LETTERS[k],
                        x: round(x),
                        y: round(y),

                        /* Position as a fraction of the distance between
                           mark centres (0 = top-left mark, 1 = opposite
                           mark). The scanner uses these after it
                           straightens the photo. */
                        u: Math.round((x - marks.tl.x) / spanW * 10000) / 10000,
                        v: Math.round((y - marks.tl.y) / spanH * 10000) / 10000
                    });
                }
            }
        }


        return {
            ok: true,

            config: {
                questionCount,
                choiceCount,
                templatesPerPage,
                paperSize: config.paperSize
            },

            geometry: G,

            paper: { w: paper.w, h: paper.h, label: paper.label },
            template: { w: round(templateW), h: round(templateH) },
            templates,
            cutLines,

            marks,
            markSize: G.markSize,
            markSpan: { w: round(spanW), h: round(spanH) },

            orientationDot: {
                x: round(marks.tl.x + G.dotOffsetX),
                y: marks.tl.y,
                size: G.dotSize
            },

            columns,
            rows,
            bubbleDiameter: G.bubbleDiameter,
            numbers,
            bubbles,

            choiceRange: `A–${LETTERS[choiceCount - 1]}`,

            formId:
                `${paper.code}${templatesPerPage}-` +
                `${questionCount}-${LETTERS[choiceCount - 1]}`
        };
    }


    return {
        compute,
        maxChoices,
        LETTERS
    };

})();
