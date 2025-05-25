from flask import Flask, render_template, request, jsonify
from praisonaiagents import Agent
import json
from pathlib import Path

app = Flask(__name__)

# Initialize question paper storage
QUESTION_PAPER_FILE = 'question_paper.json'

def load_question_paper():
    if Path(QUESTION_PAPER_FILE).exists():
        with open(QUESTION_PAPER_FILE, 'r') as f:
            return json.load(f)
    return {'questions': [], 'total_marks': 0}

def save_question_paper(questions):
    with open(QUESTION_PAPER_FILE, 'w') as f:
        json.dump(questions, f, indent=2)

def generate_similar_question(agent, original_question, original_answer, marks):
    prompt = f"""Generate a similar question to this one:

Original Question: {original_question}
Original Answer: {original_answer}
Marks: {marks}

Provide your response in this exact format:
Question: [your generated question]
Answer: [your generated answer]

Make sure to:
1. Modify any numerical values by ±10% if present
2. Maintain the same difficulty level and concept
3. Keep the answer relevant to the modified question
4. ALWAYS use the exact format 'Question:' and 'Answer:' in your response"""
    
    try:
        result = agent.start(prompt)
        if not result or not isinstance(result, str):
            raise ValueError("Invalid response from agent")
        
        # Verify the response format
        if 'Question:' not in result or 'Answer:' not in result:
            raise ValueError("Response missing Question/Answer format")
            
        return result
    except Exception as e:
        print(f"Error generating question: {e}")
        return "Question: Error generating similar question\nAnswer: Error occurred"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generator')
def generator():
    return render_template('generator.html')

@app.route('/paper')
def paper():
    question_paper = load_question_paper()
    return render_template('paper.html', paper=question_paper)

@app.route('/api/generate', methods=['POST'])
def generate_questions():
    data = request.json
    try:
        agent = Agent(
            instructions="You are an expert in generating academic questions. Generate similar questions maintaining the same difficulty level and concept.",
            llm="ollama/llama3.2"
        )
        
        similar_questions = []
        num_questions = 3  # Number of questions to generate
        retries = 2  # Number of retries per question
        
        for i in range(num_questions):
            question_generated = False
            for attempt in range(retries):
                try:
                    result = generate_similar_question(
                        agent,
                        data['question'],
                        data['answer'],
                        data['marks']
                    )
                    
                    question, answer = extract_question_answer(result)
                    
                    # Validate the generated content
                    if question and answer and question != "Error generating similar question":
                        similar_questions.append({
                            'question': question,
                            'answer': answer,
                            'semester': data['semester'],
                            'subject': data['subject'],
                            'marks': data['marks'],
                            'blooms_level': data.get('bt_level', 'BT1'),
                            'co_level': data['co_level']
                        })
                        question_generated = True
                        break
                except Exception as e:
                    print(f"Attempt {attempt + 1} failed for question {i + 1}: {str(e)}")
                    continue
            
            if not question_generated:
                print(f"Failed to generate question {i + 1} after {retries} attempts")
        
        # Return whatever questions were successfully generated
        return jsonify(similar_questions)
    
    except Exception as e:
        print(f"Error in generate_questions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/questions', methods=['GET'])
def get_questions():
    return jsonify(load_question_paper())

@app.route('/api/questions', methods=['POST'])
def add_question():
    try:
        data = request.get_json()
        print("Received data:", data)  # Add logging
        
        if not all(key in data for key in ['question', 'answer', 'marks']):
            return jsonify({"error": "Missing required fields"}), 400
            
        # Ensure marks is integer
        data['marks'] = int(data['marks']) 
        
        # Save and return
        question_paper = load_question_paper()
        question_paper['questions'].append(data)
        save_question_paper(question_paper)
        return jsonify(question_paper)

    except Exception as e:
        app.logger.error(f"Critical error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/questions/<int:index>', methods=['DELETE'])
def delete_question(index):
    try:
        with open('question_paper.json', 'r') as f:
            data = json.load(f)
        
        if 0 <= index < len(data['questions']):
            data['questions'].pop(index)
            
            with open('question_paper.json', 'w') as f:
                json.dump(data, f, indent=4)
            
            return jsonify({'message': 'Question removed successfully'})
        else:
            return jsonify({'error': 'Invalid question index'}), 400
    except Exception as e:
        print("Full error trace:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/questions/clear', methods=['POST'])
def clear_questions():
    try:
        with open('question_paper.json', 'w') as f:
            json.dump({'questions': []}, f, indent=4)
        return jsonify({'message': 'All questions cleared successfully'})
    except Exception as e:
        return jsonify({"message": "Question added"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

def extract_question_answer(text):
    try:
        # Split on first occurrence of 'Answer:' to separate question and answer
        parts = text.split('Answer:', 1)
        if len(parts) != 2:
            return text, "Answer not found"
            
        question = parts[0].replace('Question:', '').strip()
        answer = parts[1].strip()
        
        return question, answer
    except Exception as e:
        print(f"Error extracting question and answer: {e}")
        return text, "Error processing response"

if __name__ == '__main__':
    app.run(debug=True)