const generateButton =
    document.getElementById("generateButton");

const printButton =
    document.getElementById("printButton");

const answerKey =
    document.getElementById("answerKey");

const saveKeyButton =
    document.getElementById("saveKeyButton");

const clearKeyButton =
    document.getElementById("clearKeyButton");

const applyPatternButton =
    document.getElementById("applyPatternButton");

const answerPattern =
    document.getElementById("answerPattern");

const patternCount =
    document.getElementById("patternCount");

const patternStatus =
    document.getElementById("patternStatus");

const keyName =
    document.getElementById("keyName");

const savedKeysList =
    document.getElementById("savedKeysList");


/*
====================================================
EVENT LISTENERS
====================================================
*/

generateButton.addEventListener(
    "click",
    generateAnswerSheet
);

printButton.addEventListener(
    "click",
    printSheet
);

saveKeyButton.addEventListener(
    "click",
    saveAnswerKey
);

clearKeyButton.addEventListener(
    "click",
    clearCurrentKey
);

applyPatternButton.addEventListener(
    "click",
    applyAnswerPattern
);

answerPattern.addEventListener(
    "input",
    updatePatternCount
);


/*
====================================================
STARTUP
====================================================
*/

document
    .getElementById(
        "templatesPerPage"
    )
    .addEventListener(
        "change",
        updateChoiceOptions
    );

updateChoiceOptions();

renderSavedKeys();


/*
====================================================
GENERATE ANSWER SHEET
====================================================
*/

let currentLayout = null;


function readSheetSettings() {

    return {

        questionCount:
            parseInt(
                document.getElementById(
                    "questionCount"
                ).value
            ),

        choiceCount:
            parseInt(
                document.getElementById(
                    "choiceCount"
                ).value
            ),

        paperSize:
            document.getElementById(
                "paperSize"
            ).value,

        templatesPerPage:
            parseInt(
                document.getElementById(
                    "templatesPerPage"
                ).value
            )

    };
}


function generateAnswerSheet() {

    const settings =
        readSheetSettings();

    const answerSheet =
        document.getElementById(
            "answerSheet"
        );


    const layout =
        OMRLayout.compute(
            settings
        );


    if (!layout.ok) {

        currentLayout = null;

        answerSheet.innerHTML = `
            <p class="sheet-error">
                ${escapeHTML(layout.error)}
            </p>
        `;

        return;
    }


    currentLayout = layout;


    generateAnswerKey(
        settings.questionCount,
        settings.choiceCount
    );


    setPrintPageSize(
        settings.paperSize
    );


    answerSheet.innerHTML =
        renderSheetSVG(
            layout
        );

}


/*
====================================================
CHOICE LIMITS
4 templates per page supports A–D only.
====================================================
*/

function updateChoiceOptions() {

    const templatesPerPage =
        parseInt(
            document.getElementById(
                "templatesPerPage"
            ).value
        );

    const choiceSelect =
        document.getElementById(
            "choiceCount"
        );

    const max =
        OMRLayout.maxChoices(
            templatesPerPage
        );


    [...choiceSelect.options].forEach(
        option => {

            option.disabled =
                parseInt(option.value) > max;

        }
    );


    if (
        parseInt(choiceSelect.value) > max
    ) {

        choiceSelect.value =
            String(max);

    }
}


/*
====================================================
SVG RENDERER
Draws the sheet from the numbers in layout.js.
Units are millimetres, so the sheet prints at its
true size when printed at 100%.
====================================================
*/

function renderSheetSVG(layout) {

    const paper = layout.paper;

    const templateSVG =
        renderTemplateSVG(
            layout
        );


    let svg = `
        <svg
            class="sheet-svg"
            xmlns="http://www.w3.org/2000/svg"
            width="${paper.w}mm"
            height="${paper.h}mm"
            viewBox="0 0 ${paper.w} ${paper.h}"
            font-family="Arial, Helvetica, sans-serif"
        >
            <rect
                x="0" y="0"
                width="${paper.w}"
                height="${paper.h}"
                fill="#fff"
            />
    `;


    layout.templates.forEach(
        position => {

            svg += `
                <g transform="translate(${position.x} ${position.y})">
                    ${templateSVG}
                </g>
            `;
        }
    );


    layout.cutLines.forEach(
        line => {

            svg += `
                <line
                    x1="${line.x1}" y1="${line.y1}"
                    x2="${line.x2}" y2="${line.y2}"
                    stroke="#999"
                    stroke-width="0.2"
                    stroke-dasharray="2 1.5"
                />
            `;
        }
    );


    svg += `</svg>`;

    return svg;
}


function renderTemplateSVG(layout) {

    const g = layout.geometry;
    const w = layout.template.w;
    const h = layout.template.h;
    const half = layout.markSize / 2;
    const r = layout.bubbleDiameter / 2;

    let s = "";


    /* Registration marks */

    Object.values(layout.marks).forEach(
        mark => {

            s += `
                <rect
                    x="${mark.x - half}"
                    y="${mark.y - half}"
                    width="${layout.markSize}"
                    height="${layout.markSize}"
                    fill="#000"
                />
            `;
        }
    );


    /* Orientation dot */

    const dot = layout.orientationDot;

    s += `
        <rect
            x="${dot.x - dot.size / 2}"
            y="${dot.y - dot.size / 2}"
            width="${dot.size}"
            height="${dot.size}"
            fill="#000"
        />
    `;


    /* Title */

    s += `
        <text
            x="${w / 2}"
            y="${g.titleY}"
            font-size="${g.titleFont}"
            font-weight="bold"
            text-anchor="middle"
        >MULTIPLE CHOICE ANSWER SHEET</text>
    `;


    /* Name / Section / Subject / Date fields */

    const left = g.markInset + 1;
    const right = w - g.markInset - 1;
    const split = left + (right - left) * 0.64;

    s += field("Name:", left, split - 3, g.field1Y, g.fieldFont);
    s += field("Section:", split, right, g.field1Y, g.fieldFont);
    s += field("Subject:", left, split - 3, g.field2Y, g.fieldFont);
    s += field("Date:", split, right, g.field2Y, g.fieldFont);


    /* Instruction */

    s += `
        <text
            x="${w / 2}"
            y="${g.instructionY}"
            font-size="${g.instructionFont}"
            text-anchor="middle"
        >Shade ONE circle per item completely. Use a pencil or dark pen.</text>
    `;


    /* Question numbers */

    layout.numbers.forEach(
        number => {

            s += `
                <text
                    x="${number.x}"
                    y="${number.y + g.numberFont * 0.35}"
                    font-size="${g.numberFont}"
                    font-weight="bold"
                    text-anchor="end"
                >${number.question}.</text>
            `;
        }
    );


    /* Bubbles */

    layout.bubbles.forEach(
        bubble => {

            s += `
                <circle
                    cx="${bubble.x}"
                    cy="${bubble.y}"
                    r="${r}"
                    fill="#fff"
                    stroke="#000"
                    stroke-width="0.25"
                />
                <text
                    x="${bubble.x}"
                    y="${bubble.y + g.letterFont * 0.35}"
                    font-size="${g.letterFont}"
                    fill="#888"
                    text-anchor="middle"
                >${bubble.choice}</text>
            `;
        }
    );


    /* Footer: form ID between the bottom marks */

    s += `
        <text
            x="${w / 2}"
            y="${layout.marks.bl.y + g.footerFont * 0.35}"
            font-size="${g.footerFont}"
            text-anchor="middle"
        >${layout.formId} • ${layout.config.questionCount} items • ${layout.choiceRange}</text>
    `;


    return s;
}


function field(label, x1, x2, y, fontSize) {

    return `
        <text
            x="${x1}"
            y="${y}"
            font-size="${fontSize}"
        >${label}</text>
        <line
            x1="${x1 + fontSize * 4.4}"
            y1="${y + 0.6}"
            x2="${x2}"
            y2="${y + 0.6}"
            stroke="#000"
            stroke-width="0.15"
        />
    `;
}


/*
====================================================
ANSWER KEY GENERATOR
====================================================
*/

function generateAnswerKey(
    questionCount,
    choiceCount
) {

    const choices =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ";


    let keyHTML = `

        <div class="answer-key-grid">

    `;


    for (
        let question = 1;
        question <= questionCount;
        question++
    ) {

        let optionsHTML = "";


        for (
            let choice = 0;
            choice < choiceCount;
            choice++
        ) {

            optionsHTML += `

                <option
                    value="${choices[choice]}"
                >
                    ${choices[choice]}
                </option>

            `;
        }


        keyHTML += `

            <div class="key-question">

                <div class="key-question-number">
                    ${question}.
                </div>

                <select
                    class="key-answer"
                    data-question="${question}"
                >

                    <option value="">
                        —
                    </option>

                    ${optionsHTML}

                </select>

            </div>

        `;
    }


    keyHTML += `</div>`;


    answerKey.innerHTML =
        keyHTML;
}


/*
====================================================
CLEAN PATTERN
====================================================
*/

function cleanPattern(
    pattern
) {

    return pattern
        .toUpperCase()
        .replace(
            /[^A-Z]/g,
            ""
        );
}


/*
====================================================
PATTERN COUNTER
====================================================
*/

function updatePatternCount() {

    const pattern =
        cleanPattern(
            answerPattern.value
        );


    const questionCount =
        parseInt(
            document.getElementById(
                "questionCount"
            ).value
        );


    const choiceCount =
        parseInt(
            document.getElementById(
                "choiceCount"
            ).value
        );


    const choices =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .substring(
            0,
            choiceCount
        );


    patternCount.textContent =
        `${pattern.length} answers entered`;


    if (!pattern.length) {

        patternStatus.textContent =
            "";

        return;
    }


    const invalid =
        [...pattern].some(
            letter =>
                !choices.includes(
                    letter
                )
        );


    if (invalid) {

        patternStatus.textContent =
            "Invalid answer detected.";

        patternStatus.style.color =
            "red";

        return;
    }


    if (
        pattern.length <
        questionCount
    ) {

        patternStatus.textContent =
            `${questionCount - pattern.length} more needed`;

        patternStatus.style.color =
            "darkorange";

        return;
    }


    if (
        pattern.length >
        questionCount
    ) {

        patternStatus.textContent =
            `${pattern.length - questionCount} too many`;

        patternStatus.style.color =
            "red";

        return;
    }


    patternStatus.textContent =
        "Pattern ready.";

    patternStatus.style.color =
        "green";
}


/*
====================================================
APPLY PATTERN
====================================================
*/

function applyAnswerPattern() {

    const pattern =
        cleanPattern(
            answerPattern.value
        );


    const questionCount =
        parseInt(
            document.getElementById(
                "questionCount"
            ).value
        );


    const choiceCount =
        parseInt(
            document.getElementById(
                "choiceCount"
            ).value
        );


    const choices =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .substring(
            0,
            choiceCount
        );


    if (
        pattern.length !==
        questionCount
    ) {

        alert(
            `You need exactly ${questionCount} answers.`
        );

        return;
    }


    const invalid =
        [...pattern].some(
            letter =>
                !choices.includes(
                    letter
                )
        );


    if (invalid) {

        alert(
            `Only these answers are allowed: ${choices}`
        );

        return;
    }


    for (
        let question = 1;
        question <= questionCount;
        question++
    ) {

        const input =
            document.querySelector(
                `.key-answer[data-question="${question}"]`
            );


        if (input) {

            input.value =
                pattern[
                    question - 1
                ];

        }
    }


    patternStatus.textContent =
        "Pattern applied.";

    patternStatus.style.color =
        "green";
}


/*
====================================================
GET CURRENT ANSWER KEY
====================================================
*/

function getCurrentAnswerKey() {

    const inputs =
        document.querySelectorAll(
            ".key-answer"
        );


    const key = {};


    inputs.forEach(
        input => {

            if (input.value) {

                key[
                    input.dataset.question
                ] = input.value;

            }
        }
    );


    return key;
}


/*
====================================================
SAVE NAMED KEY
====================================================
*/

function saveAnswerKey() {

    const name =
        keyName.value.trim();


    if (!name) {

        alert(
            "Please enter a name for this answer key."
        );

        keyName.focus();

        return;
    }


    const questionCount =
        document.querySelectorAll(
            ".key-answer"
        ).length;


    if (!questionCount) {

        alert(
            "Generate an answer sheet first."
        );

        return;
    }


    const key =
        getCurrentAnswerKey();


    if (
        Object.keys(key).length !==
        questionCount
    ) {

        alert(
            "Please provide an answer for every question."
        );

        return;
    }


    const choiceCount =
        parseInt(
            document.getElementById(
                "choiceCount"
            ).value
        );


    const paperSize =
        document.getElementById(
            "paperSize"
        ).value;


    const templatesPerPage =
        parseInt(
            document.getElementById(
                "templatesPerPage"
            ).value
        );


    const savedKeys =
        getSavedKeys();


    const id =
        Date.now().toString();


    savedKeys[id] = {

        id: id,

        name: name,

        questionCount:
            questionCount,

        choiceCount:
            choiceCount,

        paperSize:
            paperSize,

        templatesPerPage:
            templatesPerPage,

        answers: key,

        created:
            new Date().toISOString()

    };


    localStorage.setItem(
        "omrAnswerKeys",
        JSON.stringify(
            savedKeys
        )
    );


    renderSavedKeys();


    alert(
        `"${name}" saved.`
    );
}


/*
====================================================
GET SAVED KEYS
====================================================
*/

function getSavedKeys() {

    const saved =
        localStorage.getItem(
            "omrAnswerKeys"
        );


    if (!saved) {

        return {};

    }


    try {

        return JSON.parse(
            saved
        );

    } catch {

        return {};

    }
}


/*
====================================================
DISPLAY SAVED KEYS
====================================================
*/

function renderSavedKeys() {

    const savedKeys =
        getSavedKeys();


    const ids =
        Object.keys(
            savedKeys
        );


    if (!ids.length) {

        savedKeysList.innerHTML = `

            <p class="empty-message">
                No saved answer keys.
            </p>

        `;

        return;
    }


    let html = "";


    ids.reverse().forEach(
        id => {

            const key =
                savedKeys[id];


            const date =
                new Date(
                    key.created
                );


            html += `

                <div class="saved-key">

                    <div class="saved-key-info">

                        <div class="saved-key-name">

                            ${escapeHTML(
                                key.name
                            )}

                        </div>

                        <div class="saved-key-details">

                            ${key.questionCount}
                            items •
                            ${getChoiceLetters(
                                key.choiceCount
                            )}

                        </div>

                    </div>


                    <div class="saved-key-actions">

                        <button
                            class="load-key-button"
                            data-id="${id}"
                        >
                            Load
                        </button>


                        <button
                            class="delete-key-button"
                            data-id="${id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;
        }
    );


    savedKeysList.innerHTML =
        html;


    document
        .querySelectorAll(
            ".load-key-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        loadSavedKey(
                            button.dataset.id
                        )
                );

            }
        );


    document
        .querySelectorAll(
            ".delete-key-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteSavedKey(
                            button.dataset.id
                        )
                );

            }
        );
}


/*
====================================================
LOAD SAVED KEY
====================================================
*/

function loadSavedKey(id) {

    const savedKeys =
        getSavedKeys();


    const key =
        savedKeys[id];


    if (!key) {

        return;

    }


    /*
     * Restore settings
     */

    document.getElementById(
        "questionCount"
    ).value =
        key.questionCount;


    document.getElementById(
        "choiceCount"
    ).value =
        key.choiceCount;


    document.getElementById(
        "paperSize"
    ).value =
        key.paperSize;


    document.getElementById(
        "templatesPerPage"
    ).value =
        key.templatesPerPage;


    keyName.value =
        key.name;


    /*
     * Generate matching form
     */

    generateAnswerSheet();


    /*
     * Restore answers
     */

    Object.keys(
        key.answers
    ).forEach(
        question => {

            const input =
                document.querySelector(
                    `.key-answer[data-question="${question}"]`
                );


            if (input) {

                input.value =
                    key.answers[
                        question
                    ];

            }
        }
    );


    /*
     * Rebuild pattern
     */

    let pattern = "";


    for (
        let question = 1;
        question <= key.questionCount;
        question++
    ) {

        pattern +=
            key.answers[question] || "";

    }


    answerPattern.value =
        pattern;


    updatePatternCount();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/*
====================================================
DELETE SAVED KEY
====================================================
*/

function deleteSavedKey(id) {

    const savedKeys =
        getSavedKeys();


    const key =
        savedKeys[id];


    if (!key) {

        return;

    }


    const confirmed =
        confirm(
            `Delete "${key.name}"?`
        );


    if (!confirmed) {

        return;

    }


    delete savedKeys[id];


    localStorage.setItem(
        "omrAnswerKeys",
        JSON.stringify(
            savedKeys
        )
    );


    renderSavedKeys();
}


/*
====================================================
CLEAR CURRENT KEY
====================================================
*/

function clearCurrentKey() {

    const inputs =
        document.querySelectorAll(
            ".key-answer"
        );


    inputs.forEach(
        input => {

            input.value = "";

        }
    );


    answerPattern.value = "";

    keyName.value = "";

    updatePatternCount();

}


/*
====================================================
CHOICE LETTERS
====================================================
*/

function getChoiceLetters(
    count
) {

    return "A–" +
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            [count - 1];

}


/*
====================================================
HTML SAFETY
====================================================
*/

function escapeHTML(
    text
) {

    return text
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/*
====================================================
PRINT PAGE SIZE
Tells the browser the exact paper size so the
sheet is not scaled or cut when printing.
====================================================
*/

function setPrintPageSize(
    paperSize
) {

    const sizes = {
        letter: "8.5in 11in",
        long: "8.5in 13in"
    };


    let styleTag =
        document.getElementById(
            "printPageSize"
        );


    if (!styleTag) {

        styleTag =
            document.createElement(
                "style"
            );

        styleTag.id =
            "printPageSize";

        document.head.appendChild(
            styleTag
        );

    }


    styleTag.textContent =
        `@page { size: ${sizes[paperSize]}; margin: 0; }`;

}


/*
====================================================
PRINT
====================================================
*/

function printSheet() {

    if (!currentLayout) {

        alert(
            "Generate an answer sheet first."
        );

        return;
    }


    window.print();

}

/*
====================================================
CAMERA SCANNER
====================================================
*/

const cameraPreview =
    document.getElementById(
        "cameraPreview"
    );

const startCameraButton =
    document.getElementById(
        "startCameraButton"
    );

const captureButton =
    document.getElementById(
        "captureButton"
    );

const scanCanvas =
    document.getElementById(
        "scanCanvas"
    );

const scanStatus =
    document.getElementById(
        "scanStatus"
    );


let cameraStream = null;


/*
====================================================
START CAMERA
====================================================
*/

startCameraButton.addEventListener(
    "click",
    startCamera
);


async function startCamera() {

    try {

        scanStatus.textContent =
            "Requesting camera access...";


        cameraStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode: {
                            ideal: "environment"
                        }

                    },

                    audio: false

                });


        cameraPreview.srcObject =
            cameraStream;


        captureButton.disabled =
            false;


        scanStatus.textContent =
            "Camera ready. Place the answer sheet inside the guide.";


        startCameraButton.textContent =
            "Camera Running";


        startCameraButton.disabled =
            true;


    } catch (error) {

        console.error(
            error
        );


        scanStatus.textContent =
            "Unable to access the camera.";

        alert(
            "Camera access failed. Make sure the browser has permission to use the camera."
        );

    }

}


/*
====================================================
CAPTURE IMAGE
====================================================
*/

captureButton.addEventListener(
    "click",
    captureImage
);


function captureImage() {

    if (
        !cameraStream
    ) {

        return;

    }


    const videoWidth =
        cameraPreview.videoWidth;


    const videoHeight =
        cameraPreview.videoHeight;


    if (
        !videoWidth ||
        !videoHeight
    ) {

        scanStatus.textContent =
            "Camera image is not ready yet.";

        return;

    }


    scanCanvas.width =
        videoWidth;


    scanCanvas.height =
        videoHeight;


    const context =
        scanCanvas.getContext(
            "2d"
        );


    context.drawImage(
        cameraPreview,
        0,
        0,
        videoWidth,
        videoHeight
    );


    scanStatus.textContent =
        "Image captured. Scanner processing will be added next.";


    console.log(
        "Captured image:",
        videoWidth,
        "x",
        videoHeight
    );

}