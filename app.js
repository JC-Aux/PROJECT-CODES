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

renderSavedKeys();


/*
====================================================
GENERATE ANSWER SHEET
====================================================
*/

function generateAnswerSheet() {

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

    const answerSheet =
        document.getElementById(
            "answerSheet"
        );


    generateAnswerKey(
        questionCount,
        choiceCount
    );


    const questionColumns =
        determineQuestionColumns(
            questionCount,
            choiceCount,
            templatesPerPage
        );


    let templatesHTML = "";


    for (
        let templateNumber = 1;
        templateNumber <= templatesPerPage;
        templateNumber++
    ) {

        templatesHTML +=
            createTemplate(
                questionCount,
                choiceCount,
                questionColumns,
                templateNumber
            );

    }


    answerSheet.innerHTML = `

        <div class="
            print-page
            ${paperSize}
            templates-${templatesPerPage}
        ">

            ${templatesHTML}

        </div>

    `;

}


/*
====================================================
COLUMN CALCULATION
====================================================
*/

function determineQuestionColumns(
    questionCount,
    choiceCount,
    templatesPerPage
) {

    if (templatesPerPage === 1) {

        if (questionCount <= 20) {
            return 1;
        }

        return 2;
    }


    if (templatesPerPage === 2) {

        if (questionCount <= 15) {
            return 1;
        }

        return 2;
    }


    if (templatesPerPage === 4) {

        if (questionCount <= 10) {
            return 1;
        }

        if (questionCount <= 30) {
            return 2;
        }

        if (choiceCount === 6) {
            return 2;
        }

        return 3;
    }


    return 1;
}


/*
====================================================
CREATE TEMPLATE
====================================================
*/

function createTemplate(
    questionCount,
    choiceCount,
    questionColumns,
    templateNumber
) {

    const choices =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ";


    const columns =
        createQuestionColumns(
            questionCount,
            choiceCount,
            questionColumns
        );


    let columnsHTML = "";


    for (
        let i = 0;
        i < columns.length;
        i++
    ) {

        columnsHTML += `

            <div class="question-column">

                ${columns[i]}

            </div>

        `;
    }


    return `

        <div class="omr-template">

            <div class="
                registration-mark
                mark-top-left
            "></div>

            <div class="
                registration-mark
                mark-top-right
            "></div>

            <div class="
                registration-mark
                mark-bottom-left
            "></div>

            <div class="
                registration-mark
                mark-bottom-right
            "></div>


            <div class="form-id">
                OMR-${questionCount}-${choiceCount}-${questionColumns}
            </div>

            <div class="omr-header">

                <h2>
                    MULTIPLE CHOICE ANSWER SHEET
                </h2>

                <p>
                    Shade one answer for each question.
                </p>

            </div>


            <div class="student-info">

                <div class="info-row">

                    <div class="info-field">
                        Name:
                    </div>

                    <div class="info-field">
                        Section:
                    </div>

                </div>


                <div class="info-row">

                    <div class="info-field">
                        Subject:
                    </div>

                    <div class="info-field">
                        Date:
                    </div>

                </div>

            </div>

            <div class="omr-instruction">
                 SHADE COMPLETELY • USE PENCIL OR DARK PEN
            </div>

            <div class="omr-instruction">
                SHADE COMPLETELY • EXAMPLE: A = ● • SHADE ONLY ONE ANSWER
            </div>

            <div
                class="question-columns"
                style="
                    grid-template-columns:
                    repeat(
                        ${questionColumns},
                        1fr
                    );
                "
            >

                ${columnsHTML}

            </div>


            <div class="omr-footer">

                OMR FORM •
                ${questionCount} ITEMS •
                ${choices[choiceCount - 1]}

            </div>

        </div>

    `;
}


/*
====================================================
CREATE QUESTION COLUMNS
====================================================
*/

function createQuestionColumns(
    questionCount,
    choiceCount,
    columnCount
) {

    const choices =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ";


    const questionsPerColumn =
        Math.ceil(
            questionCount /
            columnCount
        );


    const columns = [];


    for (
        let column = 0;
        column < columnCount;
        column++
    ) {

        let columnHTML = "";


        const startQuestion =
            column *
            questionsPerColumn +
            1;


        const endQuestion =
            Math.min(
                startQuestion +
                questionsPerColumn -
                1,
                questionCount
            );


        for (
            let question =
                startQuestion;

            question <= endQuestion;

            question++
        ) {

            let bubblesHTML = "";


            for (
                let choice = 0;
                choice < choiceCount;
                choice++
            ) {

                bubblesHTML += `

                    <div
                        class="answer-bubble"
                        data-question="${question}"
                        data-choice="${choices[choice]}"
                    >

                        <span>
                            ${choices[choice]}
                        </span>

                    </div>

                `;
            }


            columnHTML += `

                <div class="question-row">

                    <div class="question-number">
                        ${question}.
                    </div>

                    ${bubblesHTML}

                </div>

            `;
        }


        columns.push(
            columnHTML
        );
    }


    return columns;
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
PRINT
====================================================
*/

function printSheet() {

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