// Handle form submission and question generation
document.addEventListener('DOMContentLoaded', () => {
    const questionForm = document.getElementById('questionForm');
    const generatedQuestions = document.getElementById('generatedQuestions');

    questionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitButton = questionForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Generating...';
        submitButton.disabled = true;

        // Gather form data
        const formData = {
            semester: document.getElementById('semester').value,
            subject: document.getElementById('subject').value,
            question: document.getElementById('question').value,
            answer: document.getElementById('answer').value,
            marks: parseInt(document.getElementById('marks').value),
            bt_level: document.getElementById('bt_level').value,
            co_level: document.getElementById('co_level').value
        };

        try {
            // Send request to generate questions
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to generate questions');

            const questions = await response.json();
            
            // Display generated questions
            generatedQuestions.innerHTML = questions.map((q, index) => `
                <div class="question-card">
                    <h3>Similar Question ${index + 1}</h3>
                    <p><strong>Question:</strong> ${q.question}</p>
                    <p><strong>Answer:</strong> ${q.answer}</p>
                    <p><strong>Marks:</strong> ${q.marks}</p>
                    <p><strong>Bloom's Level:</strong> ${q.blooms_level}</p>
                    <p><strong>CO Level:</strong> ${q.co_level}</p>
                    <button onclick="addToQuestionPaper(${JSON.stringify(q)})" class="btn-secondary">
                        Add to Question Paper
                    </button>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error:', error);
            generatedQuestions.innerHTML = `
                <div class="error-message">
                    Failed to generate questions. Please try again.
                </div>
            `;
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
});

// Function to add question to question paper
async function addToQuestionPaper(question, event) {
    console.log("BHUVI MIGHT BE GOD")
    try {
        // Ensure numeric marks
        question.marks = Number(question.marks);
        
        const response = await fetch('/api/questions', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(question)
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        console.log("BHUVI GOD")
        if (!response.ok) {
            throw new Error(data.error || 'Server error');
        }
        if (!response.ok) throw new Error('Failed to add question');

        // Show success message
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Added!';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Full error stack:', error);
        alert(`Add failed: ${error.message}`);
    }
}