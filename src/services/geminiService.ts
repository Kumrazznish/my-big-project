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
          }
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
        } else {
          throw new Error(`Service temporarily unavailable (${response.status}). Please try again later.`);
        }
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find the first { and last } to extract JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
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
  "description": "A comprehensive learning path for ${subject} designed for ${difficulty} learners",
  "totalDuration": "8-12 weeks",
  "estimatedHours": "40-60 hours",
  "prerequisites": ["Basic computer skills", "Internet access"],
  "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Introduction to ${subject}",
      "description": "Learn the fundamentals and basic concepts",
      "duration": "1 week",
      "estimatedHours": "4-6 hours",
      "difficulty": "beginner",
      "position": "left",
      "completed": false,
      "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
      "skills": ["Skill 1", "Skill 2"],
      "practicalProjects": ["Project 1"],
      "resources": 3
    }
  ]
}

Create 10-12 chapters with progressive difficulty. Alternate position between "left" and "right". Make it specific to ${subject} and appropriate for ${difficulty} level learners. Include practical projects and key skills for each chapter.

Return ONLY the JSON object, no additional text or formatting.`;

    const response = await this.makeRequest(prompt);
    
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new Error('Failed to parse roadmap response. Please try again.');
    }
  }

  async generateCourseContent(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');
    
    const prompt = `Create comprehensive course content for "${chapterTitle}" in ${subject} at ${difficulty} level.
Learning preferences: ${preferences.learningStyle || 'mixed'} style, ${preferences.timeCommitment || 'regular'} commitment.

Please respond with ONLY a valid JSON object in this exact format:

{
  "title": "${chapterTitle}",
  "description": "Detailed description of what this chapter covers",
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
  "estimatedTime": "4-6 hours",
  "content": {
    "introduction": "Introduction to the chapter concepts",
    "mainContent": "Comprehensive chapter content with explanations, examples, and key concepts. Include practical examples and real-world applications. Make this content educational and engaging.",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "summary": "Chapter summary and key takeaways"
  },
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "codeExamples": [
    {
      "title": "Example 1 Title",
      "code": "// Example code snippet 1",
      "explanation": "Explanation of the code"
    }
  ],
  "practicalExercises": [
    {
      "title": "Exercise 1",
      "description": "Exercise description",
      "difficulty": "easy"
    }
  ],
  "additionalResources": [
    {
      "title": "Resource Title",
      "url": "https://example.com",
      "type": "article",
      "description": "Brief description of the resource"
    }
  ],
  "nextSteps": ["What to do after completing this chapter"]
}

Make the content comprehensive and educational. Include practical examples relevant to ${subject}.
For videoUrl, use a real YouTube URL related to the topic if possible.
Return ONLY the JSON object, no additional text or formatting.`;

    const response = await this.makeRequest(prompt);
    
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new Error('Failed to parse course content response. Please try again.');
    }
  }

  async generateQuiz(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    const prompt = `Create a comprehensive quiz for "${chapterTitle}" in ${subject} at ${difficulty} level.

Please respond with ONLY a valid JSON object in this exact format:

{
  "chapterId": "chapter-quiz",
  "title": "Quiz: ${chapterTitle}",
  "description": "Test your understanding of ${chapterTitle}",
  "timeLimit": 300,
  "passingScore": 70,
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is the main concept of this chapter?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this is the correct answer",
      "difficulty": "easy",
      "points": 10
    }
  ],
  "totalQuestions": 10,
  "totalPoints": 100
}

Generate exactly 10 questions with varying difficulty (3 easy, 4 medium, 3 hard). Mix different types of questions (conceptual, practical, application-based) relevant to ${chapterTitle} in ${subject}.
correctAnswer should be the index (0-3) of the correct option.
Return ONLY the JSON object, no additional text or formatting.`;

    const response = await this.makeRequest(prompt);
    
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new Error('Failed to parse quiz response. Please try again.');
    }
  }
}

export const geminiService = new GeminiService();