// Handle question paper display and management
document.addEventListener('DOMContentLoaded', async () => {
    const questionPaper = document.getElementById('questionPaper');
    const totalQuestions = document.getElementById('totalQuestions');
    const totalMarks = document.getElementById('totalMarks');
    const downloadButton = document.getElementById('downloadPaper');
    const clearButton = document.getElementById('clearPaper');

    // Function to update totals
    function updateTotals(questions) {
        totalQuestions.textContent = questions.length;
        totalMarks.textContent = questions.reduce((sum, q) => sum + parseInt(q.marks), 0);
    }

    // Function to remove a question
    async function removeQuestion(index) {
        try {
            const response = await fetch(`/api/questions/${index}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to remove question');
            await loadQuestionPaper(); // Reload the paper after removal
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to clear all questions
    async function clearAllQuestions() {
        try {
            const response = await fetch('/api/questions/clear', {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to clear questions');
            await loadQuestionPaper(); // Reload the paper after clearing
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to load and display question paper
    async function loadQuestionPaper() {
        try {
            const response = await fetch('/api/questions');
            if (!response.ok) throw new Error('Failed to load question paper');

            const data = await response.json();
            const questions = data.questions;

            // Update totals
            updateTotals(questions);

            // Display questions
            questionPaper.innerHTML = questions.map((q, index) => `
                <div class="question-card">
                    <div class="question-header">
                        <h3>Question ${index + 1}</h3>
                        <div class="question-actions">
                            <span class="question-meta">
                                ${q.marks} marks | ${q.blooms_level} | CO${q.co_level}
                            </span>
                            <button onclick="removeQuestion(${index})" class="button button-error">Remove</button>
                        </div>
                    </div>
                    <div class="question-content">
                        <p class="question-text">${q.question}</p>
                        <div class="answer-section">
                            <h4 class="answer-label">Answer:</h4>
                            <p class="answer-text">${q.answer}</p>
                        </div>
                    </div>
                    <div class="question-footer">
                        <small>${q.subject} | Semester ${q.semester}</small>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error:', error);
            questionPaper.innerHTML = `
                <div class="error-message">
                    Failed to load question paper. Please refresh the page.
                </div>
            `;
        }
    }

    // Load question paper on page load
    await loadQuestionPaper();

    // Handle download button
    downloadButton.addEventListener('click', () => {
        window.print();
    });

    // Handle clear all button
    clearButton.addEventListener('click', clearAllQuestions);
});