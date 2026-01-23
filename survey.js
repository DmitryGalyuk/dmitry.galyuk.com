// Survey transformation and DOM logic moved here.
document.addEventListener('DOMContentLoaded', () => {
    // === 2. ELEMENT REFERENCES ===
    const questionsArea = document.getElementById('questions-area');
    const quizContainer = document.getElementById('quiz-container');
    const resultsContainer = document.getElementById('results-container');
    const submitButton = document.getElementById('submit-quiz');
    const resetButton = document.getElementById('reset-quiz');
    const errorMessage = document.getElementById('error-message');
    const finalScoreDisplay = document.getElementById('final-score');
    const globalRecommendationDisplay = document.getElementById('global-recommendation');
    const recommendationsList = document.getElementById('recommendations-list');
    const suggestionsContainer = document.getElementById('specific-recommendations-section');
    const templateArea = document.getElementById('template-area');
    const answersList = document.getElementById('answers-list');
    // const detailedAnswersSection = document.getElementById('detailed-answers-section');
    const noProblemsMessage = document.getElementById('no-problems-message');
    const copyResultsButton = document.getElementById('copy-results');
    const shareStatus = document.getElementById('share-status');

    let cachedRawAnswers = [];

    // === 3. RENDERING FUNCTIONS ===
    function renderQuiz() {
        const questionType2inputType = {
            'single': 'radio',
            'multi': 'checkbox',
            'text': 'text'
        };
        questionsArea.innerHTML = '';
        quizData.forEach(q => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question-block p-4 bg-gray-50 rounded-lg border border-gray-200';
            questionElement.id = q.id;

            const title = `<h3 class="text-lg font-semibold text-gray-800 mb-3">${q.questionText}</h3>`;
            let answersHtml = '';

            if (q.type == 'text') {
                answersHtml += `
                    <input type="${questionType2inputType[q.type]}" name="${q.id}" class="w-full p-3 border border-gray-300 rounded-md text-gray-700 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Введите ваш ответ здесь">
                `;
            } else if (q.type == 'single' || q.type == 'multi') {
                q.answers.forEach((a) => {
                    const inputType = questionType2inputType[q.type] || 'text';
                    const sanitizedText = a.text.replace(/"/g, '&quot;');
                    answersHtml += `
                        <label class="answer-option block mb-2 cursor-pointer">
                            <input type="${inputType}" name="${q.id}" data-points="${a.value}" data-answer-text="${sanitizedText}" ${a.recommendationTag ? `data-tag="${a.recommendationTag}"` : ''} class="hidden">
                            <div class="answer-label p-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out">
                                ${a.text}
                            </div>
                        </label>
                    `;
                });
            }

            questionElement.innerHTML = title + answersHtml;
            questionsArea.appendChild(questionElement);
        });
        addCustomInputListeners();
    }

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

            updateStyle();
            input.addEventListener('change', updateStyle);

            if (input.type === 'radio') {
                input.addEventListener('change', () => {
                    if (input.checked) {
                        document.querySelectorAll(`input[name="${input.name}"][type="radio"]`).forEach(otherInput => {
                            if (otherInput !== input) {
                                otherInput.closest('label').querySelector('.answer-label').classList.remove('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-500');
                                otherInput.closest('label').querySelector('.answer-label').classList.add('bg-gray-50', 'border-gray-300');
                            }
                        });
                    }
                });
            }
        });
    }

    // === 4. LOGIC FUNCTIONS ===
    function collectRawAnswers() {
        const rawAnswers = [];
        quizData.forEach(q => {
            let answers = [];

            if (q.type === 'text') {
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
                    tag: input.getAttribute('data-tag') || null
                }));
            }

            rawAnswers.push({
                questionId: q.id,
                questionText: q.questionText,
                category: q.category,
                type: q.type,
                optional: !!q.optional,
                answers: answers
            });
        });
        return rawAnswers;
    }

    function validateQuiz() {
        let isValid = true;
        quizData.forEach(q => {
            const questionBlock = document.getElementById(q.id);
            if (questionBlock) questionBlock.classList.remove('border-red-400', 'border-2');
            if (!q.optional) {
                switch (q.type) {
                    case 'text': {
                        const textInput = document.querySelector(`input[name="${q.id}"]`);
                        if (!textInput || !textInput.value.trim()) {
                            isValid = false;
                            if (textInput) textInput.classList.add('border-red-400', 'border-2');
                        } else {
                            textInput.classList.remove('border-red-400', 'border-2');
                        }
                        break;
                    }
                    case 'single':
                    case 'multi': {
                        const selected = document.querySelectorAll(`input[name="${q.id}"]:checked`);
                        if (selected.length === 0) {
                            isValid = false;
                            if (questionBlock) questionBlock.classList.add('border-red-400', 'border-2');
                        }
                        break;
                    }
                }
            }
        });
        return isValid;
    }

    function calculateResults(rawAnswers) {
        let totalScore = 0;
        const uniqueRecommendations = new Set();
        let maxPossibleScore = 0;

        rawAnswers.forEach(rawQ => {
            const qData = quizData.find(q => q.id === rawQ.questionId);
            if (!qData) return;
            let questionMaxScore = 0;
            if (qData.type === 'single') {
                qData.answers.forEach(a => { questionMaxScore = Math.max(questionMaxScore, a.value); });
            } else if (qData.type === 'multi') {
                qData.answers.forEach(a => { questionMaxScore += a.value > 0 ? a.value : 0; });
            }
            maxPossibleScore += questionMaxScore;
            rawQ.answers.forEach(answer => {
                if (answer.points > 0 || answer.points < 0) totalScore += answer.points;
                if (answer.tag) uniqueRecommendations.add(answer.tag);
            });
        });

        return { totalScore, maxPossibleScore, recommendations: Array.from(uniqueRecommendations) };
    }

    function displayResults(results) {
        quizContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

        const scorePercentage = (results.totalScore / results.maxPossibleScore) * 100;
        const globalRecConfig = globalScoreConfig
            .sort((a, b) => b.minPercentage - a.minPercentage)
            .find(config => scorePercentage >= config.minPercentage);

        finalScoreDisplay.classList.remove('text-green-600', 'text-yellow-600', 'text-red-600', 'text-gray-600');
        if (globalRecConfig) {
            finalScoreDisplay.classList.add(globalRecConfig.colorClass);
            const templateElement = document.getElementById(globalRecConfig.templateId);
            globalRecommendationDisplay.innerHTML = templateElement ? templateElement.innerHTML : 'Template error.';
        } else {
            finalScoreDisplay.classList.add('text-gray-600');
            globalRecommendationDisplay.textContent = 'Calculation error.';
        }

        finalScoreDisplay.textContent = `${results.totalScore} / ${results.maxPossibleScore} (${scorePercentage.toFixed(0)}%)`;
        displayDetailedAnswers(cachedRawAnswers);

        recommendationsList.innerHTML = '';
        if (results.recommendations.length > 0) {
            suggestionsContainer.classList.remove('hidden');
            noProblemsMessage.classList.add('hidden');
            results.recommendations.forEach(tag => {
                const templateId = 'rec-' + tag;
                const recElement = document.getElementById(templateId);
                const listItem = document.createElement('li');
                listItem.className = 'p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-gray-700';
                if (recElement) listItem.innerHTML = recElement.innerHTML; else listItem.textContent = 'Unknown recommendation tag: ' + tag;
                recommendationsList.appendChild(listItem);
            });
        } else {
            suggestionsContainer.classList.add('hidden');
            noProblemsMessage.classList.remove('hidden');
        }
    }

    function displayDetailedAnswers(rawAnswers) {
        answersList.innerHTML = '';
        rawAnswers.forEach((q, index) => {
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
            answersList.appendChild(listItem);
        });
    }

    function generateResultsText() {
        const scoreText = finalScoreDisplay.textContent;
        const globalRecHtml = globalRecommendationDisplay.innerHTML;
        const globalRecContainer = document.createElement('div');
        globalRecContainer.innerHTML = globalRecHtml;
        const globalRecTitle = globalRecContainer.querySelector('h3') ? globalRecContainer.querySelector('h3').textContent : 'Общая рекомендация';
        const globalRecParagraph = globalRecContainer.querySelector('p') ? globalRecContainer.querySelector('p').textContent : '';

        let resultText = `--- ОТЧЕТ О ПРОХОЖДЕНИИ ОПРОСНИКА ---\n`;
        resultText += `Дата и время: ${new Date().toLocaleString('ru-RU')}\n`;
        resultText += `\n--- ИНДЕКС САМОЧУВСТВИЯ ---\n`;
        resultText += `Общий балл: ${scoreText}\n`;
        resultText += `\n${globalRecTitle}\n`;
        resultText += `${globalRecParagraph}\n`;

        resultText += `\n\n--- ПОДРОБНЫЕ ОТВЕТЫ ---\n`;
        cachedRawAnswers.forEach((q, index) => {
            const answerText = q.answers.map(a => a.text).join('; ');
            resultText += `\nВопрос #${index + 1} (${q.type}): ${q.questionText.trim()}\n`;
            if (q.answers.length > 0) resultText += `   Ответ: ${answerText}\n`; else {
                const statusText = q.optional ? 'Пропущен (необязательный)' : 'Не выбран / Оставлен пустым';
                resultText += `   Ответ: ${statusText}\n`;
            }
        });

        resultText += `\n\n--- СПЕЦИФИЧЕСКИЕ РЕКОМЕНДАЦИИ ---\n`;
        if (recommendationsList.children.length > 0) {
            Array.from(recommendationsList.children).forEach((li, index) => {
                const strongText = li.querySelector('strong') ? li.querySelector('strong').textContent : `Пункт ${index + 1}:`;
                resultText += `\n${strongText}\n`;
                const listItems = Array.from(li.querySelectorAll('ul li')).map(item => `   • ${item.textContent.trim()}`).join('\n');
                const generalText = li.querySelector('p') ? li.querySelector('p').textContent : '';
                resultText += `${generalText}\n`;
                if (listItems) resultText += `${listItems}\n`;
            });
        } else resultText += noProblemsMessage.textContent;

        return resultText;
    }

    function copyResultsToClipboard() {
        const textToCopy = generateResultsText();
        const tempTextArea = document.createElement('textarea');
        tempTextArea.style.position = 'fixed';
        tempTextArea.style.opacity = '0';
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) showShareStatus('Результаты скопированы в буфер обмена! Просто вставьте их в мессенджер.');
            else showShareStatus('Ошибка копирования. Используйте сочетание клавиш Ctrl+C / Cmd+C.', true);
        } catch (err) {
            console.error('Fallback: Copy command failed', err);
            showShareStatus('Ошибка копирования. Используйте сочетание клавиш Ctrl+C / Cmd+C.', true);
        }
        document.body.removeChild(tempTextArea);
    }

    function showShareStatus(message, isError = false) {
        shareStatus.textContent = message;
        shareStatus.classList.remove('hidden', 'text-green-600', 'text-red-500');
        shareStatus.classList.add(isError ? 'text-red-500' : 'text-green-600');
        setTimeout(() => { shareStatus.classList.add('hidden'); }, 5000);
    }

    // === 5. EVENT HANDLERS ===
    submitButton.addEventListener('click', async () => {
        if (validateQuiz()) {
            errorMessage.classList.add('hidden');
            const rawAnswers = collectRawAnswers();
            cachedRawAnswers = rawAnswers;
            const results = calculateResults(rawAnswers);
            displayResults(results);
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            errorMessage.classList.remove('hidden');
            const firstInvalid = document.querySelector('.question-block.border-red-400, input.border-red-400');
            if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    copyResultsButton.addEventListener('click', copyResultsToClipboard);

    resetButton.addEventListener('click', () => {
        resultsContainer.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        const submissionStatus = document.getElementById('submission-status');
        if (submissionStatus) submissionStatus.classList.add('hidden');
        window.location.reload();
    });

    // Initialize
    renderQuiz();
});
