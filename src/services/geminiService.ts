const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class GeminiService {
  private async makeRequest(prompt: string, retryCount = 0): Promise<string> {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const maxRetries = 5;
    const baseDelay = 3000; // 3 seconds

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's a 503 (service overloaded) error and we haven't exceeded max retries
        if (response.status === 503 && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Gemini API overloaded. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(prompt, retryCount + 1);
        }
        
        // Try to parse the error response as JSON to extract a cleaner message
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            // Provide more user-friendly error messages for common issues
            if (response.status === 503) {
              throw new Error('The AI service is currently experiencing high demand. Please try again in a few moments.');
            }
            if (response.status === 429) {
              throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
            }
            throw new Error(errorData.error.message);
          }
        } catch (parseError) {
          // If parsing fails, fall back to the original error format
        }
        
        // Provide user-friendly error messages for different status codes
        if (response.status === 503) {
          throw new Error('The AI service is currently experiencing high demand. Please try again in a few moments.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        } else if (response.status === 401) {
          throw new Error('API authentication failed. Please check your API key configuration.');
        } else if (response.status === 400) {
          throw new Error('Invalid request. Please try again with different parameters.');
        } else {
          throw new Error(`Service temporarily unavailable (${response.status}). Please try again later.`);
        }
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API. Please try again.');
      }

      const content = data.candidates[0].content;
      if (!content.parts || !content.parts[0] || !content.parts[0].text) {
        throw new Error('No content received from AI service. Please try again.');
      }

      return content.parts[0].text;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Gemini API Error:', error.message);
        throw error;
      } else {
        console.error('Unknown Gemini API Error:', error);
        throw new Error('An unexpected error occurred while communicating with the AI service.');
      }
    }
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Find the first { and last } to extract JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }

  private validateRoadmapData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.subject &&
      data.difficulty &&
      data.description &&
      data.chapters &&
      Array.isArray(data.chapters) &&
      data.chapters.length > 0 &&
      data.chapters.every((chapter: any) => 
        chapter.id &&
        chapter.title &&
        chapter.description &&
        chapter.duration &&
        chapter.position &&
        Array.isArray(chapter.keyTopics) &&
        Array.isArray(chapter.skills) &&
        Array.isArray(chapter.practicalProjects)
      )
    );
  }

  private validateCourseContent(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.title &&
      data.description &&
      data.content &&
      typeof data.content === 'object' &&
      data.content.introduction &&
      data.content.mainContent &&
      Array.isArray(data.content.keyPoints) &&
      data.content.summary
    );
  }

  private validateQuizData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.title &&
      data.questions &&
      Array.isArray(data.questions) &&
      data.questions.length > 0 &&
      data.questions.every((question: any) => 
        question.id &&
        question.question &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < 4 &&
        question.explanation &&
        question.difficulty &&
        typeof question.points === 'number'
      )
    );
  }

  async generateRoadmap(subject: string, difficulty: string): Promise<any> {
    // Get learning preferences from localStorage
    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');
    
    const prompt = `Create a comprehensive learning roadmap for "${subject}" at "${difficulty}" level with the following preferences:
- Learning Style: ${preferences.learningStyle || 'mixed'}
- Time Commitment: ${preferences.timeCommitment || 'regular'}
- Goals: ${preferences.goals?.join(', ') || 'general learning'}

Please respond with ONLY a valid JSON object in this exact format:

{
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "description": "A comprehensive learning path for ${subject} designed for ${difficulty} learners with ${preferences.learningStyle || 'mixed'} learning style",
  "totalDuration": "8-12 weeks",
  "estimatedHours": "40-60 hours",
  "prerequisites": ["Basic computer skills", "Internet access", "Text editor or IDE"],
  "learningOutcomes": [
    "Master fundamental concepts of ${subject}",
    "Build practical projects using ${subject}",
    "Understand industry best practices",
    "Develop problem-solving skills",
    "Create a portfolio of work"
  ],
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Introduction to ${subject}",
      "description": "Learn the fundamentals and basic concepts of ${subject}",
      "duration": "1 week",
      "estimatedHours": "4-6 hours",
      "difficulty": "beginner",
      "position": "left",
      "completed": false,
      "keyTopics": ["Basic concepts", "Terminology", "Getting started", "Environment setup"],
      "skills": ["Understanding fundamentals", "Basic setup"],
      "practicalProjects": ["Hello World project"],
      "resources": 5
    },
    {
      "id": "chapter-2",
      "title": "Core Concepts",
      "description": "Deep dive into the core concepts and principles",
      "duration": "1-2 weeks",
      "estimatedHours": "6-8 hours",
      "difficulty": "beginner",
      "position": "right",
      "completed": false,
      "keyTopics": ["Core principles", "Best practices", "Common patterns"],
      "skills": ["Problem solving", "Pattern recognition"],
      "practicalProjects": ["Basic application"],
      "resources": 6
    }
  ]
}

IMPORTANT REQUIREMENTS:
1. Create exactly 10-12 chapters with progressive difficulty
2. Alternate position between "left" and "right" for each chapter
3. Make content specific to ${subject} and appropriate for ${difficulty} level
4. Include realistic time estimates and practical projects
5. Ensure keyTopics, skills, and practicalProjects are relevant arrays
6. Set all chapters as completed: false initially
7. Include 3-5 prerequisites relevant to ${subject}
8. Include 4-6 learning outcomes specific to ${subject}
9. Make descriptions detailed and educational

Return ONLY the JSON object, no additional text or formatting.`;

    const response = await this.makeRequest(prompt);
    
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);
      
      if (!this.validateRoadmapData(parsedData)) {
        throw new Error('Invalid roadmap data structure received from AI service.');
      }
      
      return parsedData;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to parse roadmap response. The AI service returned invalid data. Please try again.');
    }
  }

  async generateCourseContent(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');
    
    const prompt = `Create comprehensive course content for "${chapterTitle}" in ${subject} at ${difficulty} level.
Learning preferences: ${preferences.learningStyle || 'mixed'} style, ${preferences.timeCommitment || 'regular'} commitment.

Please respond with ONLY a valid JSON object in this exact format:

{
  "title": "${chapterTitle}",
  "description": "Comprehensive description of what this chapter covers in ${subject}",
  "learningObjectives": [
    "Understand the fundamental concepts of ${chapterTitle}",
    "Apply knowledge in practical scenarios",
    "Identify key principles and best practices",
    "Build confidence in using these concepts"
  ],
  "estimatedTime": "4-6 hours",
  "content": {
    "introduction": "This chapter introduces you to ${chapterTitle} in the context of ${subject}. We'll explore the fundamental concepts, understand why they're important, and see how they fit into the bigger picture of ${subject} development.",
    "mainContent": "Comprehensive educational content about ${chapterTitle}. This should be detailed, informative, and include practical examples. Cover the key concepts step by step, explain the reasoning behind different approaches, and provide real-world context. Include explanations of how this relates to ${subject} and why it's important for ${difficulty} level learners. Make this content substantial and educational - at least 500 words of detailed explanation with examples and practical applications.",
    "keyPoints": [
      "Key concept 1 related to ${chapterTitle}",
      "Key concept 2 with practical application",
      "Key concept 3 for ${difficulty} level understanding",
      "Best practices and common pitfalls",
      "Real-world applications and use cases"
    ],
    "summary": "In this chapter, we covered the essential aspects of ${chapterTitle} in ${subject}. You learned about the core concepts, saw practical examples, and understand how to apply this knowledge. The key takeaways include understanding the fundamentals, recognizing patterns, and being able to implement these concepts in your own projects."
  },
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "codeExamples": [
    {
      "title": "Basic Example: ${chapterTitle}",
      "code": "// Example code demonstrating ${chapterTitle} concepts\n// This is a practical example for ${difficulty} level\nconsole.log('Hello, ${subject}!');",
      "explanation": "This example demonstrates the basic concepts of ${chapterTitle}. It shows how to implement the fundamental principles we discussed in a practical way."
    },
    {
      "title": "Advanced Example: ${chapterTitle} in Practice",
      "code": "// More advanced example showing real-world usage\n// Suitable for ${difficulty} level learners\nfunction example() {\n  return 'Advanced ${chapterTitle} example';\n}",
      "explanation": "This advanced example shows how ${chapterTitle} is used in real-world scenarios. It demonstrates best practices and common patterns."
    }
  ],
  "practicalExercises": [
    {
      "title": "Exercise 1: Basic ${chapterTitle}",
      "description": "Practice the fundamental concepts by implementing a basic example of ${chapterTitle}",
      "difficulty": "easy"
    },
    {
      "title": "Exercise 2: Applied ${chapterTitle}",
      "description": "Apply your knowledge to solve a practical problem using ${chapterTitle} concepts",
      "difficulty": "medium"
    }
  ],
  "additionalResources": [
    {
      "title": "Official ${subject} Documentation",
      "url": "https://example.com/docs",
      "type": "documentation",
      "description": "Official documentation covering ${chapterTitle} concepts"
    },
    {
      "title": "Tutorial: ${chapterTitle} Deep Dive",
      "url": "https://example.com/tutorial",
      "type": "tutorial",
      "description": "Comprehensive tutorial on ${chapterTitle} with examples"
    }
  ],
  "nextSteps": [
    "Practice the concepts covered in this chapter",
    "Complete the practical exercises",
    "Review the additional resources for deeper understanding",
    "Prepare for the next chapter by reviewing key concepts"
  ]
}

IMPORTANT REQUIREMENTS:
1. Make all content specific to ${subject} and ${chapterTitle}
2. Ensure content is appropriate for ${difficulty} level
3. Include realistic and educational code examples
4. Make the mainContent substantial (at least 500 words)
5. Include practical exercises that reinforce learning
6. Provide relevant additional resources
7. Use a real YouTube URL if possible, otherwise use placeholder
8. Make learning objectives specific and measurable

Return ONLY the JSON object, no additional text or formatting.`;

    const response = await this.makeRequest(prompt);
    
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);
      
      if (!this.validateCourseContent(parsedData)) {
        throw new Error('Invalid course content data structure received from AI service.');
      }
      
      return parsedData;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to parse course content response. The AI service returned invalid data. Please try again.');
    }
  }

  async generateQuiz(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    const prompt = `Create a comprehensive quiz for "${chapterTitle}" in ${subject} at ${difficulty} level.

Please respond with ONLY a valid JSON object in this exact format:

{
  "chapterId": "chapter-quiz",
  "title": "Quiz: ${chapterTitle}",
  "description": "Test your understanding of ${chapterTitle} concepts in ${subject}",
  "timeLimit": 600,
  "passingScore": 70,
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is the main purpose of ${chapterTitle} in ${subject}?",
      "options": [
        "Option A - Incorrect but plausible answer",
        "Option B - Correct answer with clear explanation",
        "Option C - Incorrect but related concept",
        "Option D - Clearly incorrect option"
      ],
      "correctAnswer": 1,
      "explanation": "The correct answer is B because ${chapterTitle} serves this specific purpose in ${subject}. This is important because it helps developers understand the fundamental concepts and apply them effectively.",
      "difficulty": "easy",
      "points": 10
    }
  ],
  "totalQuestions": 10,
  "totalPoints": 100
}

IMPORTANT REQUIREMENTS:
1. Generate exactly 10 questions with varying difficulty:
   - 3 easy questions (10 points each)
   - 4 medium questions (10 points each)  
   - 3 hard questions (10 points each)
2. Each question must have exactly 4 options
3. correctAnswer must be the index (0-3) of the correct option
4. Include detailed explanations for each answer
5. Make questions specific to ${chapterTitle} and ${subject}
6. Ensure questions are appropriate for ${difficulty} level
7. Mix different types of questions: conceptual, practical, application-based
8. Make incorrect options plausible but clearly wrong
9. Set timeLimit to 600 seconds (10 minutes)
10. Set passingScore to 70%

Return ONLY the JSON object, no additional text or formatting.`;

    const response = await this.makeRequest(prompt);
    
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);
      
      if (!this.validateQuizData(parsedData)) {
        throw new Error('Invalid quiz data structure received from AI service.');
      }
      
      // Ensure we have exactly 10 questions
      if (parsedData.questions.length !== 10) {
        throw new Error('Quiz must contain exactly 10 questions.');
      }
      
      return parsedData;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to parse quiz response. The AI service returned invalid data. Please try again.');
    }
  }
}

export const geminiService = new GeminiService();