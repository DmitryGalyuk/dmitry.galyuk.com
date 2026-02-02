/**
 * Health Navigator SPA - Core Logic
 * Implements routing, state management, question rendering, result calculation, QR code generation, and distributor info display.
 */

// ========================================================================== \n// 1. Global Variables and Constants \n// ========================================================================== \n
const LOCAL_STORAGE_KEY = 'health_test_state';
const DEBUG_MODE_PARAM = '?debug=true';

const state = {
    currentScreen: 'welcome', // 'welcome', 'quiz', 'results'
    currentQuestionIndex: 0,
    answers: [],
    quizData: [],
    recommendationData: {},
    globalRecommendations: {},
    distributors: {},
    currentDistributor: null,
    contentMode: 'test', // 'test' (cold) or 'checkpoint' (club)
    results: null // Stores calculated results once quiz is finished
};

const Elements = {
    app: document.getElementById('app'),
    welcomeScreen: document.getElementById('welcome-screen'),
    startQuizButton: document.getElementById('start-quiz-button'),
    quizContainer: document.getElementById('quiz-container'),
    questionsArea: document.getElementById('questions-area'),
    prevQuestionButton: document.getElementById('prev-question-button'),
    nextQuestionButton: document.getElementById('next-question-button'),
    submitQuizButton: document.getElementById('submit-quiz'),
    errorMessage: document.getElementById('error-message'),
    resultsContainer: document.getElementById('results-container'),
    finalScoreDisplay: document.getElementById('final-score'),
    globalRecommendationDisplay: document.getElementById('global-recommendation'),
    specificRecommendationsSection: document.getElementById('specific-recommendations-section'),
    recommendationsList: document.getElementById('recommendations-list'),
    noProblemsMessage: document.getElementById('no-problems-message'),
    qrCodeImg: document.getElementById('qr-code-img'),
    copyResultsButton: document.getElementById('copy-results'),
    shareStatus: document.getElementById('share-status'),
    resetQuizButton: document.getElementById('reset-quiz'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    distributorInfoSection: document.getElementById('distributor-info-section'),
    // distributorName: document.getElementById('distributor-name'),
    // distributorRegLink: document.getElementById('distributor-reg-link'),
    distributorContacts: document.getElementById('distributor-contacts'),
};

// ========================================================================== \n// 2. Utility Functions \n// ========================================================================== \n
/**
 * Fetches JSON data from a given URL.
 * @param {string} url - The URL to fetch JSON from.
 * @returns {Promise<Object>} - A promise that resolves to the JSON data.
 */
async function loadJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading JSON from ${url}:`, error);
        return null;
    }
}

/**
 * Saves the current application state to LocalStorage.
 */
function saveState() {
    const stateToSave = {
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
}

/**
 * Loads application state from LocalStorage.
 * @returns {boolean} - True if state was loaded, false otherwise.
 */
function loadState() {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        state.currentQuestionIndex = parsedState.currentQuestionIndex || 0;
        state.answers = parsedState.answers || [];
        return true;
    }
    return false;
}

/**
 * Clears the saved state from LocalStorage.
 */
function clearState() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
}

/**
 * Gets the selected range for global recommendations based on score percentage.
 * @param {number} scorePercentage - The score percentage.
 * @returns {number} - The selected range key.
 */
function getSelectedRange(scorePercentage) {
    const upperRanges = Object.keys(state.globalRecommendations).map(Number).sort((a, b) => a - b);
    let selectedRange = null;
    for (let range of upperRanges) {
        if (scorePercentage < range) {
            selectedRange = range;
            break;
        }
    }
    if (!selectedRange) {
        selectedRange = upperRanges[upperRanges.length - 1];
    }
    return selectedRange;
}

/**
 * Updates the visibility of screens based on the current state.
 */
function updateView() {
    Elements.welcomeScreen.classList.add('hidden');
    Elements.quizContainer.classList.add('hidden');
    Elements.resultsContainer.classList.add('hidden');

    switch (state.currentScreen) {
        case 'welcome':
            Elements.welcomeScreen.classList.remove('hidden');
            break;
        case 'quiz':
            Elements.quizContainer.classList.remove('hidden');
            renderQuestion(state.currentQuestionIndex);
            break;
        case 'results':
            Elements.resultsContainer.classList.remove('hidden');
            renderResultsScreen();
            break;
    }
}

/**
 * Navigates to a specific screen.
 * @param {string} screenName - The name of the screen to navigate to ('welcome', 'quiz', 'results').
 */
function navigateTo(screenName) {
    state.currentScreen = screenName;
    updateView();
}

// ========================================================================== \n// 3. Rendering Functions \n// ========================================================================== \n
/**
 * Renders a single question on the quiz screen.
 * @param {number} index - The index of the question to render.
 */
function renderQuestion(index) {
    Elements.questionsArea.innerHTML = '';
    Elements.errorMessage.classList.add('hidden');

    if (index < 0 || index >= state.quizData.length) {
        console.error('Invalid question index:', index);
        navigateTo('welcome'); // Fallback to welcome screen
        return;
    }

    const q = state.quizData[index];
    const questionElement = document.createElement('div');
    questionElement.className = 'question-block p-4 bg-gray-50 rounded-lg border border-gray-200';
    questionElement.id = q.id;

    const title = `<h3 class="text-lg font-semibold text-gray-800 mb-3">${q.questionText}</h3>`;
    let answersHtml = '';

    const questionType2inputType = {
        'single': 'radio',
        'multi': 'checkbox',
        'input': 'text' // Added for text input type
    };

    if (q.type === 'input') {
        const existingAnswer = state.answers[index] && state.answers[index].answers[0] ? state.answers[index].answers[0].text : '';
        answersHtml += `
            <input type="${questionType2inputType[q.type]}" name="${q.id}" class="w-full p-3 border border-gray-300 rounded-md text-gray-700 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Введите ваш ответ здесь" value="${existingAnswer}">
        `;
    } else if (q.type === 'single' || q.type === 'multi') {
        q.answers.forEach((a) => {
            const inputType = questionType2inputType[q.type];
            const sanitizedText = a.text.replace(/"/g, '&quot;');
            const isChecked = state.answers[index] && state.answers[index].answers.some(ans => ans.text === a.text);
            answersHtml += `
                <label class="answer-option block mb-2 cursor-pointer">
                    <input type="${inputType}" name="${q.id}" data-points="${a.value}" data-answer-text="${sanitizedText}" ${a.triggers && a.triggers.length > 0 ? `data-triggers="${a.triggers.join(' ')}"` : ''} class="hidden" ${isChecked ? 'checked' : ''}>
                    <div class="answer-label p-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out">
                        ${a.text}
                    </div>\n                </label>
            `;
        });
    }

    questionElement.innerHTML = title + answersHtml;
    Elements.questionsArea.appendChild(questionElement);

    addCustomInputListeners();
    updateProgressBar();
    updateNavigationButtons();

    // Scroll to the top of the quiz container when a new question is rendered
    Elements.quizContainer.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Adds custom styling logic for radio and checkbox inputs.
 */
function addCustomInputListeners() {
    document.querySelectorAll('.answer-option input[type="radio"], .answer-option input[type="checkbox"]').forEach(input => {
        const labelDiv = input.closest('label').querySelector('.answer-label');

        const updateStyle = () => {
            if (input.checked) {
                labelDiv.classList.add('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-500');
                labelDiv.classList.remove('bg-gray-50', 'border-gray-300');
            } else {
                labelDiv.classList.remove('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-500');
                labelDiv.classList.add('bg-gray-50', 'border-gray-300');
            }
        };

        updateStyle(); // Apply initial style
        input.addEventListener('change', () => {
            // For radio buttons, uncheck other radio buttons in the same group
            if (input.type === 'radio') {
                document.querySelectorAll(`input[name="${input.name}"][type="radio"]`).forEach(otherInput => {
                    if (otherInput !== input) {
                        otherInput.closest('label').querySelector('.answer-label').classList.remove('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-500');
                        otherInput.closest('label').querySelector('.answer-label').classList.add('bg-gray-50', 'border-gray-300');
                    }
                });
            }
            updateStyle(); // Apply style to the changed input
            saveCurrentAnswer(); // Save state immediately after an answer changes
            saveState();
        });
    });

    document.querySelectorAll('.question-block input[type="text"]').forEach(input => {
        input.addEventListener('input', () => {
            saveCurrentAnswer(); // Save state immediately after text input changes
            saveState();
        });
    });
}

/**
 * Updates the progress bar and text.
 */
function updateProgressBar() {
    const progress = state.currentQuestionIndex + 1;
    const total = state.quizData.length;
    const percentage = (progress / total) * 100;

    Elements.progressBar.style.width = `${percentage}%`;
    Elements.progressText.textContent = `${progress}/${total}`;
}

/**
 * Updates the visibility of navigation buttons (Prev, Next, Submit).
 */
function updateNavigationButtons() {
    Elements.prevQuestionButton.classList.toggle('hidden', state.currentQuestionIndex === 0);
    Elements.nextQuestionButton.classList.toggle('hidden', state.currentQuestionIndex >= state.quizData.length - 1);
    Elements.submitQuizButton.classList.toggle('hidden', state.currentQuestionIndex < state.quizData.length - 1);
}

/**
 * Renders the results screen with scores, recommendations, and QR code.
 */
async function renderResultsScreen() {
    if (!state.results) {
        console.error('Results not calculated yet.');
        navigateTo('welcome');
        return;
    }

    // Clear previous results
    Elements.recommendationsList.innerHTML = '';
    Elements.qrCodeImg.src = '';

    const { totalScore, maxPossibleScore, scorePercentage, recommendations } = state.results;

    // Find the appropriate global recommendation based on upper range
    const selectedRange = getSelectedRange(scorePercentage);

    const rangeData = state.globalRecommendations[selectedRange.toString()];
    const recData = rangeData[state.contentMode]; // 'test' or 'checkpoint'

    // Set color class based on range
    const colorClass = 'text-' + rangeData.color + '-600';

    Elements.finalScoreDisplay.classList.remove('text-green-600', 'text-yellow-600', 'text-red-600', 'text-gray-600');
    Elements.finalScoreDisplay.classList.add(colorClass);
    Elements.globalRecommendationDisplay.innerHTML = recData ? `<h3>${recData.title}</h3><p>${recData.description}</p>` : 'Recommendation error.';
    Elements.finalScoreDisplay.textContent = `${totalScore} / ${maxPossibleScore} (${scorePercentage.toFixed(0)}%)`;

    // Display specific recommendations
    if (recommendations.length > 0) {
        Elements.specificRecommendationsSection.classList.remove('hidden');
        Elements.noProblemsMessage.classList.add('hidden');

        const uniqueRecommendationTags = new Set();
        recommendations.forEach(tag => uniqueRecommendationTags.add(tag));

        for (const tag of uniqueRecommendationTags) {
            // Fetch recommendation text from recommendationData based on contentMode
            const recommendationEntry = state.recommendationData[tag];
            let recommendationText = 'Unknown recommendation.';
            if (recommendationEntry) {
                recommendationText = state.contentMode === 'checkpoint' && recommendationEntry.productText
                    ? recommendationEntry.productText
                    : recommendationEntry.genericText;
            }

            const listItem = document.createElement('li');
            listItem.className = 'p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-gray-700';
            listItem.innerHTML = `<p>${recommendationText}</p>`;
            Elements.recommendationsList.appendChild(listItem);
        }
    } else {
        Elements.specificRecommendationsSection.classList.add('hidden');
        Elements.noProblemsMessage.classList.remove('hidden');
    }

    // Display detailed answers
    /*
    Elements.detailedAnswersSection.classList.add('hidden'); // Hide the detailed answers section as per user request
    Elements.answersList.innerHTML = '';
    state.answers.forEach((q, index) => {
        const answerText = q.answers.map(a => a.text).join('; ');
        const listItem = document.createElement('li');
        listItem.className = 'p-3 border-b border-gray-100 last:border-b-0';
        if (q.answers.length > 0) {
            listItem.innerHTML = `
                <p class="font-semibold text-gray-800">#${index + 1}: ${q.questionText}</p>
                <p class="mt-1 text-gray-600 italic">Ответ: ${answerText}</p>
            `;
        } else {
            const statusText = q.optional ? 'Пропущен (необязательный)' : 'Не выбран / Пусто';
            listItem.innerHTML = `
                <p class="font-semibold text-gray-800">#${index + 1}: ${q.questionText}</p>
                <p class="mt-1 text-red-500 italic">Ответ: ${statusText}</p>
            `;
        }
        Elements.answersList.appendChild(listItem);
    });
    */

    // Generate QR Code
    await generateQrCode();

    // Display Distributor Info
    displayDistributorInfo();

    clearState(); // Clear state after displaying results
}

// ========================================================================== \n// 4. Logic Functions \n// ========================================================================== \n
/**
 * Collects the answers for the current question and saves them to the state.
 */
function saveCurrentAnswer() {
    const q = state.quizData[state.currentQuestionIndex];
    let answers = [];

    if (q.type === 'input') {
        const textInput = document.querySelector(`input[name="${q.id}"][type="text"]`);
        const textValue = textInput ? textInput.value.trim() : '';
        if (textValue) {
            answers.push({ text: textValue, points: 0, tag: null });
        }
    } else if (q.type === 'single' || q.type === 'multi') {
        const selected = document.querySelectorAll(`input[name="${q.id}"]:checked`);
        answers = Array.from(selected).map(input => ({
            text: input.getAttribute('data-answer-text'),
            points: parseInt(input.getAttribute('data-points'), 10),
            tag: input.getAttribute('data-triggers') || null // Changed to 'data-triggers' to match the data
        }));
    }

    state.answers[state.currentQuestionIndex] = {
        questionId: q.id,
        questionText: q.questionText,
        category: q.category,
        type: q.type,
        optional: !!q.optional,
        answers: answers
    };
}

/**
 * Validates the answers for the current question.
 * @returns {boolean} - True if the current question is valid, false otherwise.
 */
function validateCurrentQuestion() {
    const q = state.quizData[state.currentQuestionIndex];
    const questionBlock = document.getElementById(q.id);
    if (questionBlock) questionBlock.classList.remove('border-red-400', 'border-2');
    Elements.errorMessage.classList.add('hidden');

    if (!q.optional) {
        switch (q.type) {
            case 'input': {
                const textInput = document.querySelector(`input[name="${q.id}"]`);
                if (!textInput || !textInput.value.trim()) {
                    if (textInput) textInput.classList.add('border-red-400', 'border-2');
                    Elements.errorMessage.classList.remove('hidden');
                    return false;
                } else {
                    textInput.classList.remove('border-red-400', 'border-2');
                }
                break;
            }
            case 'single':
            case 'multi': {
                const selected = document.querySelectorAll(`input[name="${q.id}"]:checked`);
                if (selected.length === 0) {
                    if (questionBlock) questionBlock.classList.add('border-red-400', 'border-2');
                    Elements.errorMessage.classList.remove('hidden');
                    return false;
                }
                break;
            }
        }
    }
    return true;
}

/**
 * Calculates the final results based on all collected answers.
 * @param {Array} rawAnswers - The array of all collected answers.
 * @returns {Object} - An object containing totalScore, maxPossibleScore, and recommendations.
 */
function calculateResults(rawAnswers) {
    let totalScore = 0;
    const uniqueRecommendations = new Set();
    let maxPossibleScore = 0;

    rawAnswers.forEach(rawQ => {
        const qData = state.quizData.find(q => q.id === rawQ.questionId);
        if (!qData) return;

        let questionMaxScore = 0;
        if (qData.type === 'single') {
            qData.answers.forEach(a => { questionMaxScore = Math.max(questionMaxScore, a.value); });
        } else if (qData.type === 'multi') {
            qData.answers.forEach(a => { questionMaxScore += a.value > 0 ? a.value : 0; });
        }
        maxPossibleScore += questionMaxScore;

        rawQ.answers.forEach(answer => {
            if (answer.points !== undefined && (answer.points > 0 || answer.points < 0)) totalScore += answer.points;
            if (answer.tag) {
                answer.tag.split(' ').forEach(tag => uniqueRecommendations.add(tag));
            }
        });
    });

    const scorePercentage = (totalScore / maxPossibleScore) * 100;

    return { totalScore, maxPossibleScore, scorePercentage, recommendations: Array.from(uniqueRecommendations) };
}

/**
 * Generates the text content for the QR code.
 * @returns {string} - The formatted text for the QR code.
 */
function generateQrCodeText() {
    const { totalScore, maxPossibleScore, scorePercentage, recommendations } = state.results;

    // Find the appropriate global recommendation based on upper range
    const selectedRange = getSelectedRange(scorePercentage);

    const rangeData = state.globalRecommendations[selectedRange.toString()];
    const recData = rangeData[state.contentMode];
    const level = rangeData.level;
    const globalRecommendationText = recData ? recData.title : 'Не определено';

    let qrText = `${new Date().toLocaleString('ru-RU')}\n`;
    qrText += `Total Score: ${totalScore} / ${maxPossibleScore} (${scorePercentage.toFixed(0)}%)\n`;
    qrText += `Level: ${level} (${globalRecommendationText})\n`;

    state.answers.forEach((q, index) => {
        const answerTexts = q.answers.map(a => a.text).join('; ');
        qrText += `${q.questionId}: ${answerTexts}\n`;
    });

    if (recommendations.length > 0) {
        qrText += `\nTriggered Tags: ${recommendations.join(', ')}\n`;
    }

    return qrText;
}

/**
 * Generates and displays the QR code.
 */
async function generateQrCode() {
    const qrText = generateQrCodeText();
    try {
        const dataUrl = await QRCode.toDataURL(qrText, { errorCorrectionLevel: 'H', width: 256 });
        Elements.qrCodeImg.src = dataUrl;
    } catch (err) {
        console.error('Error generating QR code:', err);
        Elements.qrCodeImg.alt = 'Error generating QR code.';
    }
}

/**
 * Displays distributor information if available for the current origin.
 */
function displayDistributorInfo() {
    const origin = window.location.origin;
    const distributor = state.distributors[origin];

    if (distributor) {
        state.currentDistributor = distributor;
        Elements.distributorInfoSection.classList.remove('hidden');
        // Elements.distributorName.textContent = distributor.name;
        // Elements.distributorRegLink.href = distributor.regLink;

        Elements.distributorContacts.innerHTML = '';
        if (distributor.contacts) {
            if (distributor.contacts.tg) {
                const tgLink = document.createElement('a');
                tgLink.href = distributor.contacts.tg;
                tgLink.target = '_blank';
                tgLink.className = 'flex items-center space-x-2 text-gray-600 hover:text-blue-500';
                tgLink.innerHTML = `<img src="images/telegram.svg" alt="Telegram" class="w-6 h-6"/><span>Telegram</span>`;
                Elements.distributorContacts.appendChild(tgLink);
            }
            if (distributor.contacts.wa) {
                const waLink = document.createElement('a');
                waLink.href = distributor.contacts.wa;
                waLink.target = '_blank';
                waLink.className = 'flex items-center space-x-2 text-gray-600 hover:text-green-500';
                waLink.innerHTML = `<img src="images/whatsapp.svg" alt="WhatsApp" class="w-6 h-6"/><span>WhatsApp</span>`;
                Elements.distributorContacts.appendChild(waLink);
            }
            if (distributor.contacts.vb) {
                const vbLink = document.createElement('a');
                vbLink.href = distributor.contacts.vb;
                vbLink.target = '_blank';
                vbLink.className = 'flex items-center space-x-2 text-gray-600 hover:text-blue-700';
                vbLink.innerHTML = `<img src="images/viber.svg" alt="Viber" class="w-6 h-6"/><span>Viber</span>`;
                Elements.distributorContacts.appendChild(vbLink);
            }
            if (distributor.contacts.ig) {
                const igLink = document.createElement('a');
                igLink.href = distributor.contacts.ig;
                igLink.target = '_blank';
                igLink.className = 'flex items-center space-x-2 text-gray-600 hover:text-pink-500';
                igLink.innerHTML = `<img src="images/instagram.svg" alt="Instagram" class="w-6 h-6"/><span>Instagram</span>`;
                Elements.distributorContacts.appendChild(igLink);
            }
        }
    } else {
        Elements.distributorInfoSection.classList.add('hidden');
    }
}

// ========================================================================== \n// 5. Event Handlers \n// ========================================================================== \n
Elements.startQuizButton.addEventListener('click', () => {
    navigateTo('quiz');
});

Elements.nextQuestionButton.addEventListener('click', () => {
    if (validateCurrentQuestion()) {
        saveCurrentAnswer();
        state.currentQuestionIndex++;
        saveState();
        if (state.currentQuestionIndex < state.quizData.length) {
            renderQuestion(state.currentQuestionIndex);
        } else {
            // Should not happen if submit button is correctly shown/hidden
            handleSubmitQuiz();
        }
    }
});

Elements.prevQuestionButton.addEventListener('click', () => {
    if (state.currentQuestionIndex > 0) {
        saveCurrentAnswer(); // Save current state before going back
        state.currentQuestionIndex--;
        saveState();
        renderQuestion(state.currentQuestionIndex);
    }
});

Elements.submitQuizButton.addEventListener('click', handleSubmitQuiz);

async function handleSubmitQuiz() {
    if (validateCurrentQuestion()) {
        saveCurrentAnswer(); // Save the last answer
        Elements.errorMessage.classList.add('hidden');
        state.results = calculateResults(state.answers);
        saveState(); // Save results to state (optional, if you want to persist results beyond refresh)
        navigateTo('results');
    }
}

Elements.copyResultsButton.addEventListener('click', copyResultsToClipboard);

function copyResultsToClipboard() {
    const textToCopy = generateQrCodeText(); // Use QR code text for copying
    navigator.clipboard.writeText(textToCopy).then(() => {
        showShareStatus('Результаты скопированы в буфер обмена! Просто вставьте их в мессенджер.');
    }).catch(err => {
        console.error('Failed to copy results:', err);
        showShareStatus('Ошибка копирования. Пожалуйста, скопируйте вручную.', true);
    });
}

function showShareStatus(message, isError = false) {
    Elements.shareStatus.textContent = message;
    Elements.shareStatus.classList.remove('hidden', 'text-green-600', 'text-red-500');
    Elements.shareStatus.classList.add(isError ? 'text-red-500' : 'text-green-600');
    setTimeout(() => { Elements.shareStatus.classList.add('hidden'); }, 5000);
}

Elements.resetQuizButton.addEventListener('click', () => {
    clearState();
    state.currentQuestionIndex = 0;
    state.answers = [];
    state.results = null;
    window.location.reload(); // Simple way to reset everything
});

// ========================================================================== \n// 6. Initialization \n// ========================================================================== \n
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    const [surveyData, distributors] = await Promise.all([
        loadJSON('survey-data.json'),
        loadJSON('distributors.json')
    ]);

    if (!surveyData || !distributors || !surveyData.questions || !surveyData.recommendations || !surveyData.globalRecommendations) {
        Elements.app.innerHTML = '<div class="flex-center"><p class="text-red-600 text-xl">Ошибка загрузки данных приложения. Пожалуйста, попробуйте позже.</p></div>';
        return;
    }

    state.quizData = surveyData.questions; // Assign the questions array
    state.recommendationData = surveyData.recommendations; // Store recommendations separately
    state.globalRecommendations = surveyData.globalRecommendations; // Store global recommendations
    state.distributors = distributors;

    // Determine content mode
    if (window.location.pathname.startsWith('/checkpoint')) {
        state.contentMode = 'checkpoint';
    } else if (window.location.pathname.startsWith('/opros')) {
        state.contentMode = 'test';
        state.distributors = {}; // Disable distributor info in test mode
    }
    else {
        state.contentMode = 'test'; // Default to cold mode
    }

    const isDebugMode = window.location.search.includes(DEBUG_MODE_PARAM);
    const hasSavedState = loadState();

    if (isDebugMode && hasSavedState && state.answers.length === state.quizData.length) {
        // If debug mode and all questions answered, jump to results
        state.results = calculateResults(state.answers);
        navigateTo('results');
    } else if (hasSavedState && state.currentQuestionIndex < state.quizData.length) {
        // Resume quiz from saved state
        navigateTo('quiz');
    } else {
        // Start fresh
        clearState();
        state.currentQuestionIndex = 0;
        state.answers = [];
        navigateTo('welcome');
    }

    // Initial view update
    updateView();
}
