const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Enhanced rate limiting configuration
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 8; // Conservative limit
  private readonly timeWindow = 60000; // 1 minute
  private lastRequestTime = 0;
  private readonly minInterval = 4000; // 4 seconds between requests

  canMakeRequest(): boolean {
    const now = Date.now();

    // Check minimum interval
    if (now - this.lastRequestTime < this.minInterval) {
      return false;
    }

    // Clean old requests
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    const now = Date.now();
    this.requests.push(now);
    this.lastRequestTime = now;
  }

  getWaitTime(): number {
    const now = Date.now();
    const intervalWait = this.minInterval - (now - this.lastRequestTime);

    if (intervalWait > 0) return intervalWait;

    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    const rateLimitWait = this.timeWindow - (now - oldestRequest);
    return Math.max(0, rateLimitWait);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

const rateLimiter = new RateLimiter();

export class GeminiService {
  private async makeRequest(prompt: string, retryCount = 0): Promise<string> {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const maxRetries = 3;
    const baseDelay = 6000;

    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }

    try {
      rateLimiter.recordRequest();
      console.log(`Making Gemini API request (attempt ${retryCount + 1}/${maxRetries + 1})`);

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
        console.error(`API Error ${response.status}:`, errorText);

        if (response.status === 429) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 3000;
            console.log(`Rate limited. Retrying in ${Math.ceil(delay / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.makeRequest(prompt, retryCount + 1);
          } else {
            throw new Error('Rate limit exceeded. Please wait a few minutes and try again.');
          }
        }

        if (response.status === 503 || response.status === 500) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 4000;
            console.log(`Service error. Retrying in ${Math.ceil(delay / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.makeRequest(prompt, retryCount + 1);
          } else {
            throw new Error('The AI service is currently experiencing issues. Please try again later.');
          }
        }

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            if (errorData.error.message.includes('quota') || errorData.error.message.includes('limit')) {
              throw new Error('API quota exceeded. Please wait before trying again.');
            }
            throw new Error(`API Error: ${errorData.error.message}`);
          }
        } catch (parseError) {
          // Continue with generic error handling
        }

        switch (response.status) {
          case 400:
            throw new Error('Invalid request format. Please try again.');
          case 401:
            throw new Error('API authentication failed. Please check your API key.');
          case 403:
            throw new Error('Access forbidden. Please check your API permissions.');
          default:
            throw new Error(`Service temporarily unavailable (${response.status}). Please try again later.`);
        }
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from AI service.');
      }

      const content = data.candidates[0].content;
      if (!content.parts || !content.parts[0] || !content.parts[0].text) {
        throw new Error('No content received from AI service.');
      }

      console.log('Successfully received response from Gemini API');
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
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.trim();

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
    console.log('Generating roadmap for:', { subject, difficulty });

    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');

    const prompt = `Create a comprehensive learning roadmap for "${subject}" at "${difficulty}" level.

Learning preferences:
- Style: ${preferences.learningStyle || 'mixed'}
- Time: ${preferences.timeCommitment || 'regular'}
- Goals: ${preferences.goals?.join(', ') || 'general learning'}

Return ONLY valid JSON in this exact format:

{
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "description": "Comprehensive ${subject} learning path for ${difficulty} level learners",
  "totalDuration": "8-12 weeks",
  "estimatedHours": "40-60 hours",
  "prerequisites": ["Basic computer skills", "Internet access", "Text editor"],
  "learningOutcomes": [
    "Master ${subject} fundamentals",
    "Build practical projects",
    "Understand best practices",
    "Develop problem-solving skills"
  ],
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Introduction to ${subject}",
      "description": "Learn the fundamentals of ${subject}",
      "duration": "1 week",
      "estimatedHours": "4-6 hours",
      "difficulty": "beginner",
      "position": "left",
      "completed": false,
      "keyTopics": ["Basic concepts", "Setup", "First steps"],
      "skills": ["Understanding fundamentals", "Environment setup"],
      "practicalProjects": ["Hello World project"],
      "resources": 5
    }
  ]
}

Requirements:
- Create exactly 10-12 chapters
- Alternate position: "left", "right"
- Progressive difficulty
- Realistic time estimates
- Relevant content for ${subject}
- All chapters completed: false

Return ONLY the JSON object.`;

    const response = await this.makeRequest(prompt);

    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      if (!this.validateRoadmapData(parsedData)) {
        throw new Error('Invalid roadmap data structure received.');
      }

      return parsedData;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new Error('Failed to parse roadmap response. Please try again.');
    }
  }

  async generateCourseContent(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');

    // Get a proper YouTube video ID for the subject and chapter
    const getYouTubeVideoId = (subject: string, chapter: string): string => {
      // Map common subjects to actual educational video IDs
      const videoMappings: { [key: string]: string } = {
        'programming': 'rfscVS0vtbw', // Learn Programming in 10 Minutes
        'web-development': 'UB1O30fR-EE', // HTML, CSS, JS Explained
        'javascript': 'PkZNo7MFNFg', // Learn JavaScript
        'python': 'kqtD5dpn9C8', // Python for Beginners
        'react': 'Ke90Tje7VS0', // React Tutorial
        'data-science': 'ua-CiDNNj30', // Data Science Explained
        'machine-learning': 'ukzFI9rgwfU', // Machine Learning Explained
        'design': 'YiLUYf4HDh4', // UI/UX Design
        'mathematics': 'WUvTyaaNkzM', // Mathematics Explained
        'business': 'SlteusaKev4' // Business Strategy
      };

      // Find the best match for the subject
      const subjectKey = Object.keys(videoMappings).find(key =>
        subject.toLowerCase().includes(key) || chapter.toLowerCase().includes(key)
      );

      return videoMappings[subjectKey] || 'dQw4w9WgXcQ'; // Default fallback
    };

    const videoId = getYouTubeVideoId(subject, chapterTitle);

    const prompt = `Create comprehensive course content for "${chapterTitle}" in ${subject} at ${difficulty} level.

Return ONLY valid JSON:

{
  "title": "${chapterTitle}",
  "description": "Comprehensive guide to ${chapterTitle} in ${subject}",
  "learningObjectives": [
    "Understand ${chapterTitle} fundamentals",
    "Apply concepts practically",
    "Master key techniques",
    "Build real projects"
  ],
  "estimatedTime": "4-6 hours",
  "content": {
    "introduction": "This chapter introduces ${chapterTitle} in ${subject}. You'll learn the core concepts, understand practical applications, and see how it fits into the broader ${subject} ecosystem.",
    "mainContent": "Detailed explanation of ${chapterTitle} concepts. This comprehensive guide covers the fundamental principles, practical applications, and real-world examples. We'll explore step-by-step implementations, common patterns, and best practices. You'll learn how to apply these concepts in real projects, understand the underlying theory, and master the practical skills needed for ${difficulty} level proficiency. The content includes detailed explanations, code examples, and practical exercises to reinforce your learning.",
    "keyPoints": [
      "Core concept 1 of ${chapterTitle}",
      "Practical application techniques",
      "Best practices and patterns",
      "Common pitfalls to avoid",
      "Real-world use cases"
    ],
    "summary": "In this chapter, you mastered ${chapterTitle} in ${subject}. You learned the fundamental concepts, explored practical applications, and understand how to implement these skills in real projects."
  },
  "videoId": "${videoId}",
  "codeExamples": [
    {
      "title": "Basic ${chapterTitle} Example",
      "code": "// ${chapterTitle} example for ${subject}\\n// This demonstrates core concepts\\nconsole.log('Learning ${chapterTitle}');\\n\\nfunction example() {\\n  return '${chapterTitle} implementation';\\n}\\n\\nexample();",
      "explanation": "This example demonstrates the basic concepts of ${chapterTitle}. It shows the fundamental syntax and structure you'll use in ${subject}."
    },
    {
      "title": "Advanced ${chapterTitle} Implementation",
      "code": "// Advanced ${chapterTitle} example\\n// Real-world implementation\\nclass ${chapterTitle.replace(/\\s+/g, '')} {\\n  constructor() {\\n    this.initialized = true;\\n  }\\n  \\n  process() {\\n    return 'Advanced ${chapterTitle} processing';\\n  }\\n}\\n\\nconst instance = new ${chapterTitle.replace(/\\s+/g, '')}();\\nconsole.log(instance.process());",
      "explanation": "This advanced example shows how ${chapterTitle} is implemented in production code. It demonstrates best practices and real-world patterns."
    }
  ],
  "practicalExercises": [
    {
      "title": "Basic ${chapterTitle} Exercise",
      "description": "Implement a basic ${chapterTitle} solution using the concepts learned",
      "difficulty": "easy"
    },
    {
      "title": "Advanced ${chapterTitle} Project",
      "description": "Build a complete project incorporating ${chapterTitle} techniques",
      "difficulty": "medium"
    }
  ],
  "additionalResources": [
    {
      "title": "Official ${subject} Documentation",
      "url": "https://developer.mozilla.org/en-US/docs/Web/${subject}",
      "type": "documentation",
      "description": "Official documentation for ${chapterTitle}"
    },
    {
      "title": "${chapterTitle} Tutorial",
      "url": "https://www.freecodecamp.org/news/search?query=${chapterTitle.replace(/\\s+/g, '-').toLowerCase()}",
      "type": "tutorial",
      "description": "Comprehensive tutorial on ${chapterTitle}"
    }
  ],
  "nextSteps": [
    "Practice the exercises",
    "Review the code examples",
    "Explore additional resources",
    "Apply concepts in your own projects"
  ]
}

Make content specific to ${subject} and appropriate for ${difficulty} level.
Return ONLY the JSON object.`;

    const response = await this.makeRequest(prompt);

    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      if (!this.validateCourseContent(parsedData)) {
        throw new Error('Invalid course content structure received.');
      }

      return parsedData;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new Error('Failed to parse course content. Please try again.');
    }
  }

  async generateQuiz(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const prompt = `Create a comprehensive quiz for "${chapterTitle}" in ${subject} at ${difficulty} level.

Return ONLY valid JSON:

{
  "chapterId": "chapter-quiz",
  "title": "Quiz: ${chapterTitle}",
  "description": "Test your understanding of ${chapterTitle} in ${subject}",
  "timeLimit": 600,
  "passingScore": 70,
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is the main purpose of ${chapterTitle} in ${subject}?",
      "options": [
        "Incorrect but plausible answer A",
        "Correct answer explaining the main purpose",
        "Incorrect but related concept C",
        "Clearly incorrect option D"
      ],
      "correctAnswer": 1,
      "explanation": "The correct answer is B because ${chapterTitle} serves this specific purpose in ${subject}. This is fundamental to understanding how it works.",
      "difficulty": "easy",
      "points": 10
    }
  ],
  "totalQuestions": 10,
  "totalPoints": 100
}

Requirements:
- Exactly 10 questions
- Mix of difficulties: 3 easy, 4 medium, 3 hard
- Each question: 10 points
- 4 options per question
- correctAnswer: index (0-3)
- Detailed explanations
- Content specific to ${chapterTitle} and ${subject}
- Appropriate for ${difficulty} level

Return ONLY the JSON object.`;

    const response = await this.makeRequest(prompt);

    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      if (!this.validateQuizData(parsedData)) {
        throw new Error('Invalid quiz data structure received.');
      }

      if (parsedData.questions.length !== 10) {
        throw new Error('Quiz must contain exactly 10 questions.');
      }

      return parsedData;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new Error('Failed to parse quiz response. Please try again.');
    }
  }

  getRateLimitStatus(): { canMakeRequest: boolean; waitTime: number; requestsRemaining: number } {
    const canMakeRequest = rateLimiter.canMakeRequest();
    const waitTime = rateLimiter.getWaitTime();
    const requestsRemaining = rateLimiter.getRemainingRequests();

    return {
      canMakeRequest,
      waitTime,
      requestsRemaining
    };
  }
}

export const geminiService = new GeminiService();