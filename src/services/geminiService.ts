// src/services/geminiService.ts

// Ensure you have a .env file in your project root with VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
// Example .env file content:
// VITE_GEMINI_API_KEY=AIzaSyB...

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * A robust RateLimiter class to manage API request frequency.
 * This helps prevent exceeding the Gemini API's quota limits.
 */
class RateLimiter {
  private requests: number[] = []; // Stores timestamps of recent requests
  
  // maxRequests: Maximum number of requests allowed within the timeWindow.
  // Gemini's free tier typically allows 60 RPM (Requests Per Minute).
  // Setting this conservatively lower (e.g., 20) provides a buffer.
  private readonly maxRequests = 20; // Allowing for roughly 20 requests per minute

  // timeWindow: The duration in milliseconds over which maxRequests is enforced.
  private readonly timeWindow = 60000; // 1 minute (60 seconds)

  // lastRequestTime: Timestamp of the very last request made.
  private lastRequestTime = 0;

  // minInterval: Minimum time (in milliseconds) that *must* pass between consecutive requests.
  // For 20 requests in 60 seconds (60000ms), the average interval is 3000ms.
  // Setting it to this or slightly higher ensures a minimum pause.
  private readonly minInterval = 3000; // 3 seconds minimum between requests

  /**
   * Determines if a new request can be made based on rate limits.
   * @returns true if a request can be made, false otherwise.
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    // 1. Check if the minimum interval between requests has passed
    if (now - this.lastRequestTime < this.minInterval) {
      return false; // Cannot make request yet, too soon
    }

    // 2. Clean out old requests from the 'requests' array that are outside the current time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    // 3. Check if the number of current requests within the window exceeds the maximum allowed
    return this.requests.length < this.maxRequests;
  }

  /**
   * Records the timestamp of a successful request.
   */
  recordRequest(): void {
    const now = Date.now();
    this.requests.push(now);
    this.lastRequestTime = now;
  }

  /**
   * Calculates the estimated time (in milliseconds) to wait before the next request can be made.
   * This helps in providing user feedback or implementing intelligent retry logic.
   * @returns The wait time in milliseconds.
   */
  getWaitTime(): number {
    const now = Date.now();

    // Calculate wait time based on the minimum interval first
    const intervalWait = this.minInterval - (now - this.lastRequestTime);
    if (intervalWait > 0) {
      return intervalWait; // Still need to wait for the minimum interval to pass
    }

    // If no requests have been made or we're below maxRequests, no rate limit wait
    if (this.requests.length === 0 || this.requests.length < this.maxRequests) {
      return 0;
    }

    // Calculate wait time based on the time window and max requests
    // Find the timestamp of the oldest request that is still within the window
    const oldestRequest = Math.min(...this.requests);
    const rateLimitWait = this.timeWindow - (now - oldestRequest);

    // Ensure wait time is not negative
    return Math.max(0, rateLimitWait);
  }

  /**
   * Gets the number of remaining requests that can be made within the current time window.
   * @returns The number of remaining requests.
   */
  getRemainingRequests(): number {
    const now = Date.now();
    // Re-filter to ensure accuracy for remaining requests
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Instantiate the global rate limiter
const rateLimiter = new RateLimiter();

/**
 * Service class for interacting with the Gemini API.
 * Encapsulates all API request logic, including rate limiting and error handling.
 */
export class GeminiService {

  /**
   * Core method to make a request to the Gemini API.
   * Includes rate limiting, exponential backoff, and robust error handling.
   * @param prompt The text prompt to send to the Gemini model.
   * @param retryCount Current retry attempt number (internal use).
   * @returns A promise that resolves with the generated text from the AI.
   * @throws Error if the API key is missing, rate limit is exceeded, or other API errors occur.
   */
  private async makeRequest(prompt: string, retryCount = 0): Promise<string> {
    // 1. API Key Check
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const maxRetries = 3; // Maximum number of retry attempts for transient errors
    const baseDelay = 6000; // Base delay for exponential backoff (6 seconds)

    // 2. Rate Limit Check (Pre-flight)
    // This check prevents sending a request if we know it will immediately fail due to our local rate limiter.
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      if (waitTime > 0) {
        console.warn(`Rate limit active. Waiting ${Math.ceil(waitTime / 1000)} seconds before attempting request.`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // After waiting, re-check if a request can be made, or if we should throw an error.
        // This prevents infinite loops if waitTime doesn't clear the condition.
        if (!rateLimiter.canMakeRequest()) {
             throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds and try again.`);
        }
      } else {
        // This case should ideally not be hit if canMakeRequest is false, but as a safeguard:
        throw new Error(`Rate limit exceeded. Please wait a few moments and try again.`);
      }
    }

    try {
      // 3. Record Request (Post-Rate Limit Check, Pre-Send)
      rateLimiter.recordRequest(); // Record the request as being sent
      console.log(`Making Gemini API request (attempt ${retryCount + 1}/${maxRetries + 1})`);

      // 4. Send API Request
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
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        })
      });

      // 5. Handle API Response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);

        // Specific handling for 429 (Too Many Requests - Rate Limit)
        if (response.status === 429) {
          if (retryCount < maxRetries) {
            // Exponential backoff with jitter to avoid thundering herd problem
            const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 3000;
            console.log(`Rate limited (HTTP 429). Retrying in ${Math.ceil(delay / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.makeRequest(prompt, retryCount + 1); // Retry the request
          } else {
            throw new Error('Rate limit exceeded. Please wait a few minutes and try again.');
          }
        }

        // Specific handling for 500 (Internal Server Error) or 503 (Service Unavailable)
        if (response.status === 503 || response.status === 500) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 4000;
            console.log(`Service error (${response.status}). Retrying in ${Math.ceil(delay / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.makeRequest(prompt, retryCount + 1); // Retry the request
          } else {
            throw new Error('The AI service is currently experiencing issues. Please try again later.');
          }
        }

        // Attempt to parse specific error messages from the API response body
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            if (errorData.error.message.includes('quota') || errorData.error.message.includes('limit')) {
              throw new Error('API quota exceeded. Please wait before trying again.');
            }
            throw new Error(`API Error: ${errorData.error.message}`);
          }
        } catch (parseError) {
          // If JSON parsing fails or no specific error message, fall through to generic handling
        }

        // Generic error handling for other HTTP status codes
        switch (response.status) {
          case 400: throw new Error('Invalid request format. Please try again.');
          case 401: throw new Error('API authentication failed. Please check your API key.');
          case 403: throw new Error('Access forbidden. Please check your API permissions.');
          default: throw new Error(`Service temporarily unavailable (${response.status}). Please try again later.`);
        }
      }

      // 6. Process Successful Response
      const data = await response.json();

      // Validate the structure of the successful response from Gemini
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
      // 7. Centralized Error Logging
      if (error instanceof Error) {
        console.error('Gemini API Request Failed:', error.message);
        throw error; // Re-throw to propagate the error
      } else {
        console.error('An unexpected error occurred during Gemini API communication:', error);
        throw new Error('An unexpected error occurred while communicating with the AI service.');
      }
    }
  }

  /**
   * Cleans a JSON string received from the Gemini API, often removing markdown fences.
   * This is helpful because LLMs sometimes wrap JSON in ```json ... ``` blocks.
   * @param response The raw string response from the AI.
   * @returns A cleaned string that should be valid JSON.
   */
  private cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.trim();

    // Further robust cleaning: find the first and last brace to ensure it's a valid JSON object string
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned.trim();
  }

  /**
   * Validates the structure of a parsed roadmap data object.
   * @param data The parsed JSON object.
   * @returns True if the data conforms to the expected roadmap structure, false otherwise.
   */
  private validateRoadmapData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.subject === 'string' &&
      typeof data.difficulty === 'string' &&
      typeof data.description === 'string' &&
      Array.isArray(data.chapters) &&
      data.chapters.length > 0 &&
      data.chapters.every((chapter: any) =>
        typeof chapter.id === 'string' &&
        typeof chapter.title === 'string' &&
        typeof chapter.description === 'string' &&
        typeof chapter.duration === 'string' &&
        typeof chapter.position === 'string' &&
        Array.isArray(chapter.keyTopics) &&
        Array.isArray(chapter.skills) &&
        Array.isArray(chapter.practicalProjects)
      )
    );
  }

  /**
   * Validates the structure of parsed course content data.
   * @param data The parsed JSON object.
   * @returns True if the data conforms to the expected course content structure, false otherwise.
   */
  private validateCourseContent(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      typeof data.description === 'string' &&
      data.content &&
      typeof data.content === 'object' &&
      typeof data.content.introduction === 'string' &&
      typeof data.content.mainContent === 'string' &&
      Array.isArray(data.content.keyPoints) &&
      typeof data.content.summary === 'string'
    );
  }

  /**
   * Validates the structure of parsed quiz data.
   * @param data The parsed JSON object.
   * @returns True if the data conforms to the expected quiz structure, false otherwise.
   */
  private validateQuizData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      Array.isArray(data.questions) &&
      data.questions.length > 0 &&
      data.questions.every((question: any) =>
        typeof question.id === 'string' &&
        typeof question.question === 'string' &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < 4 &&
        typeof question.explanation === 'string' &&
        typeof question.difficulty === 'string' &&
        typeof question.points === 'number'
      )
    );
  }

  /**
   * Generates a learning roadmap for a given subject and difficulty.
   * @param subject The subject for the roadmap (e.g., "Web Development", "Python").
   * @param difficulty The difficulty level (e.g., "beginner", "intermediate", "advanced").
   * @returns A promise that resolves with the parsed roadmap data.
   * @throws Error if API key is missing, rate limit is hit, or parsing fails.
   */
  async generateRoadmap(subject: string, difficulty: string): Promise<any> {
    console.log('Attempting to generate roadmap for:', { subject, difficulty });

    // Client-side rate limit check for immediate feedback
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }

    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');

    // Construct the prompt for the Gemini API to generate a roadmap.
    // Ensure the prompt clearly requests ONLY JSON in the specified format.
    const prompt = `Create a comprehensive learning roadmap for "${subject}" at "${difficulty}" level, tailored to user preferences.
Learning preferences:
- Style: ${preferences.learningStyle || 'mixed'}
- Time: ${preferences.timeCommitment || 'regular'}
- Goals: ${preferences.goals?.join(', ') || 'general learning'}
The roadmap should be highly detailed, practical, and structured.
Return ONLY valid JSON in this exact format, ensuring all fields are populated correctly and realistically:
{
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "description": "Comprehensive ${subject} learning path for ${difficulty} level learners, focusing on practical skills and project-based learning.",
  "totalDuration": "8-12 weeks",
  "estimatedHours": "40-60 hours",
  "prerequisites": ["Basic computer skills", "Internet access", "Text editor", "Basic understanding of programming concepts (if applicable)"],
  "learningOutcomes": [
    "Master ${subject} fundamentals and advanced concepts",
    "Build practical, real-world projects to solidify understanding",
    "Understand industry best practices and common patterns",
    "Develop strong problem-solving and critical thinking skills specific to ${subject}",
    "Gain confidence in applying ${subject} knowledge to diverse challenges"
  ],
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Introduction to ${subject} Basics and Setup",
      "description": "Explore the foundational concepts, history, and core principles of ${subject}. Set up your development environment and run your first basic application.",
      "duration": "1 week",
      "estimatedHours": "4-6 hours",
      "difficulty": "beginner",
      "position": "left",
      "completed": false,
      "keyTopics": ["What is ${subject}?", "Why learn ${subject}?", "Development environment setup", "Basic syntax and data types", "Running your first program"],
      "skills": ["Environment configuration", "Basic syntax comprehension", "Program execution", "Debugging simple errors"],
      "practicalProjects": ["'Hello World' application", "Simple calculator program"],
      "resources": 5
    },
    {
      "id": "chapter-2",
      "title": "Core Concepts and Data Structures in ${subject}",
      "description": "Dive deeper into ${subject}'s fundamental building blocks, including control flow, functions, and common data structures. Learn how to organize and manipulate data effectively.",
      "duration": "1 week",
      "estimatedHours": "5-7 hours",
      "difficulty": "beginner",
      "position": "right",
      "completed": false,
      "keyTopics": ["Variables and constants", "Operators", "Conditional statements (if/else)", "Loops (for, while)", "Functions and scope", "Arrays, objects/dictionaries"],
      "skills": ["Logical flow control", "Function definition and invocation", "Data storage and retrieval", "Iterating over collections"],
      "practicalProjects": ["To-Do List (array-based)", "Simple data processing script"],
      "resources": 6
    }
    // ... AI will generate more chapters here, up to 10-12 ...
  ]
}
Requirements for JSON generation:
- Create exactly 10-12 highly relevant and distinct chapters for "${subject}" at "${difficulty}" level.
- Each chapter must have a unique "id" (e.g., "chapter-1", "chapter-2").
- Each chapter's "position" should strictly alternate between "left" and "right".
- The difficulty should progressively increase across chapters (e.g., "beginner", "intermediate", "advanced").
- Provide realistic and appropriate "duration" and "estimatedHours" for each chapter.
- Ensure "keyTopics", "skills", and "practicalProjects" are specific, actionable, and relevant to the chapter title and overall subject/difficulty.
- All "completed" fields must be 'false'.
- All arrays (keyTopics, skills, practicalProjects) must have at least 2 items.
- Ensure the overall "totalDuration" and "estimatedHours" reflect the sum of chapter efforts.
- Double-check that the JSON is perfectly valid and adheres to the specified schema.
Return ONLY the JSON object, do not include any explanatory text or markdown fences outside the JSON.`;

    const response = await this.makeRequest(prompt);

    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      if (!this.validateRoadmapData(parsedData)) {
        console.error("Invalid roadmap data structure:", parsedData);
        throw new Error('Invalid roadmap data structure received from AI. Please try again.');
      }

      // Additional check for chapter count
      if (parsedData.chapters.length < 10 || parsedData.chapters.length > 12) {
        throw new Error(`AI generated ${parsedData.chapters.length} chapters. Expected 10-12 chapters.`);
      }

      return parsedData;
    } catch (error) {
      console.error('JSON Parsing or Validation Error for Roadmap:', error);
      throw new Error('Failed to parse or validate roadmap response. Please try again.');
    }
  }

  /**
   * Generates detailed course content for a specific chapter.
   * @param chapterTitle The title of the chapter.
   * @param subject The overall subject.
   * @param difficulty The difficulty level.
   * @returns A promise that resolves with the parsed course content data.
   * @throws Error if API key is missing, rate limit is hit, or parsing fails.
   */
  async generateCourseContent(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    console.log('Attempting to generate course content for:', { chapterTitle, subject, difficulty });

    // Client-side rate limit check for immediate feedback
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }
    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');

    // Helper function to get a relevant YouTube video ID.
    // In a real application, you might use a YouTube Data API search here.
    const getYouTubeVideoId = (subj: string, chapter: string): string => {
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

      const subjectKey = Object.keys(videoMappings).find(key =>
        subj.toLowerCase().includes(key) || chapter.toLowerCase().includes(key)
      );

      return videoMappings[subjectKey] || 'dQw4w9WgXcQ'; // Default fallback (Rick Astley - Never Gonna Give You Up)
    };
    const videoId = getYouTubeVideoId(subject, chapterTitle);

    // Construct the prompt for generating course content.
    const prompt = `Create comprehensive course content for the chapter titled "${chapterTitle}" within a "${subject}" learning path at a "${difficulty}" level.
The content should be detailed, educational, and include specific learning objectives, estimated time, main content, key points, code examples, practical exercises, and additional resources.
Return ONLY valid JSON in this exact format:
{
  "title": "${chapterTitle}",
  "description": "Comprehensive guide to ${chapterTitle} in ${subject}, suitable for ${difficulty} level learners. This section covers fundamental concepts, practical applications, and best practices.",
  "learningObjectives": [
    "Understand the core principles and concepts of ${chapterTitle}",
    "Be able to apply ${chapterTitle} concepts in practical scenarios",
    "Master key techniques and tools related to ${chapterTitle}",
    "Gain skills to build real-world components or projects utilizing ${chapterTitle}"
  ],
  "estimatedTime": "4-6 hours",
  "content": {
    "introduction": "This chapter provides an in-depth introduction to ${chapterTitle} within the realm of ${subject}. We will explore its significance, underlying theory, and how it forms a crucial part of your learning journey. Prepare to build a strong foundation and understand the context of ${chapterTitle} in practical development.",
    "mainContent": "This comprehensive section delves into the specifics of ${chapterTitle}. You will learn about its fundamental syntax, common usage patterns, and advanced techniques. We will cover:
1. **Core Syntax and Structure**: Detailed explanation of how ${chapterTitle} is written and structured in ${subject}. Includes common pitfalls and best practices.
2. **Key Concepts Explained**: In-depth look at the most important concepts underpinning ${chapterTitle}, with analogies and real-world examples to aid understanding.
3. **Practical Application**: Step-by-step guides and scenarios demonstrating how to use ${chapterTitle} to solve common problems. Focus on practical implementation.
4. **Advanced Topics (if applicable)**: Explore more complex aspects, optimizations, and considerations for using ${chapterTitle} in larger projects or specific contexts.
5. **Debugging and Troubleshooting**: Common errors related to ${chapterTitle} and strategies to identify and fix them.
The content is designed to be highly accessible for a ${difficulty} audience, breaking down complex ideas into manageable parts with clear explanations and actionable advice.",
    "keyPoints": [
      "Understanding the fundamental building blocks of ${chapterTitle}",
      "Applying ${chapterTitle} in various coding scenarios",
      "Recognizing best practices for efficient and clean ${chapterTitle} implementation",
      "Troubleshooting common issues related to ${chapterTitle}",
      "Integrating ${chapterTitle} effectively within larger ${subject} projects"
    ],
    "summary": "In this chapter, you gained a thorough understanding of ${chapterTitle} in ${subject}. You learned to apply its core concepts, mastered practical implementation techniques, and are now equipped to leverage this knowledge in your development endeavors. Continue to practice and build projects to reinforce your learning."
  },
  "videoId": "https://www.youtube.com/watch?v=${videoId}",
  "codeExamples": [
    {
      "title": "Basic ${chapterTitle} Syntax Example",
      "code": "// This is a simple ${subject} example for ${chapterTitle}\n// Demonstrates the basic structure and usage\nfunction greet(name) {\n  console.log(`Hello, ${name} from ${chapterTitle}!`);\n}\n\ngreet('Learner');\n\n// Basic variable declaration\nlet myVariable = 10;\nconsole.log('My variable:', myVariable);",
      "explanation": "This example illustrates the foundational syntax for ${chapterTitle} in ${subject}. It shows how to define basic functions and declare variables, which are essential for starting with any new concept."
    },
    {
      "title": "Practical ${chapterTitle} Implementation Snippet",
      "code": "// A more practical example of ${chapterTitle} in ${subject}\n// Demonstrates a common use case or pattern\nclass DataProcessor {\n  constructor(data) {\n    this.data = data;\n  }\n\n  process() {\n    // Simulate data transformation using ${chapterTitle} logic\n    const transformedData = this.data.map(item => item * 2);\n    return `Processed data using ${chapterTitle}: ${transformedData.join(', ')}`;\n  }\n}\n\nconst processor = new DataProcessor([1, 2, 3, 4]);\nconsole.log(processor.process());",
      "explanation": "This code snippet shows a more practical application of ${chapterTitle}. It demonstrates how to integrate the concept within a class structure, perform operations, and produce a meaningful result, reflecting typical usage in a ${subject} project."
    }
  ],
  "practicalExercises": [
    {
      "title": "Exercise 1: Implement a basic ${chapterTitle} function",
      "description": "Create a function that takes two arguments and uses ${chapterTitle} principles to return a computed value. Focus on correct syntax and parameter handling.",
      "difficulty": "easy"
    },
    {
      "title": "Exercise 2: Build a small project using ${chapterTitle} and loops",
      "description": "Develop a console application that collects user input and processes it using the concepts learned in ${chapterTitle} combined with loop structures. For example, a simple inventory manager.",
      "difficulty": "medium"
    }
  ],
  "additionalResources": [
    {
      "title": "Official ${subject} Documentation for ${chapterTitle}",
      "url": "https://developer.mozilla.org/en-US/docs/Web/${subject}/Reference/Statements/${chapterTitle.replace(/\\s+/g, '')}",
      "type": "documentation",
      "description": "The official and most reliable source for in-depth information and reference for ${chapterTitle} in ${subject}."
    },
    {
      "title": "Advanced ${chapterTitle} Tutorial on FreeCodeCamp",
      "url": "https://www.freecodecamp.org/news/search?query=${chapterTitle.replace(/\\s+/g, '-').toLowerCase()}-tutorial",
      "type": "tutorial",
      "description": "A comprehensive tutorial covering advanced aspects and practical applications of ${chapterTitle} with examples."
    }
  ],
  "nextSteps": [
    "Thoroughly practice all provided exercises to reinforce understanding.",
    "Experiment with the code examples, modify them, and observe changes.",
    "Explore the additional resources to deepen your knowledge.",
    "Start a small personal project that heavily utilizes ${chapterTitle} to apply your skills."
  ]
}
Make the 'content.mainContent' detailed and extensive, covering several sub-points related to the chapter.
Ensure all generated fields are highly specific to "${chapterTitle}" and "${subject}" at the "${difficulty}" level.
All arrays must contain at least 2 relevant items.
Return ONLY the JSON object.`;

    const response = await this.makeRequest(prompt);

    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      if (!this.validateCourseContent(parsedData)) {
        console.error("Invalid course content data structure:", parsedData);
        throw new Error('Invalid course content structure received from AI. Please try again.');
      }

      return parsedData;
    } catch (error) {
      console.error('JSON Parsing or Validation Error for Course Content:', error);
      throw new Error('Failed to parse or validate course content. Please try again.');
    }
  }

  /**
   * Generates a quiz for a specific chapter.
   * @param chapterTitle The title of the chapter for which to generate the quiz.
   * @param subject The overall subject.
   * @param difficulty The difficulty level of the quiz questions.
   * @returns A promise that resolves with the parsed quiz data.
   * @throws Error if API key is missing, rate limit is hit, or parsing fails.
   */
  async generateQuiz(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    console.log('Attempting to generate quiz for:', { chapterTitle, subject, difficulty });

    // Client-side rate limit check for immediate feedback
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }

    // Construct the prompt for generating quiz questions.
    const prompt = `Create a comprehensive multiple-choice quiz for the chapter titled "${chapterTitle}" within a "${subject}" learning path at a "${difficulty}" level.
The quiz should be challenging yet fair, with clear questions, plausible distractors, and helpful explanations.
Return ONLY valid JSON in this exact format, ensuring all fields are correctly populated:
{
  "chapterId": "quiz-for-${chapterTitle.toLowerCase().replace(/\\s+/g, '-')}",
  "title": "Quiz: ${chapterTitle} in ${subject}",
  "description": "Test your understanding of the key concepts and practical applications of ${chapterTitle} within ${subject}. This quiz covers fundamental knowledge to advanced problem-solving relevant to the ${difficulty} level.",
  "timeLimit": 600, // Time limit in seconds (10 minutes)
  "passingScore": 70, // Percentage
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is the primary function of a variable in ${subject}, as discussed in the context of ${chapterTitle}?",
      "options": [
        "To define new programming languages.",
        "To store and manipulate data within a program's memory.",
        "To execute external commands on the operating system.",
        "To create graphical user interfaces."
      ],
      "correctAnswer": 1,
      "explanation": "Variables are fundamental to programming across all languages, including ${subject}. Their primary function is to serve as named containers for data values, allowing those values to be stored, retrieved, and modified during program execution. This was a core concept in the introduction to ${chapterTitle}.",
      "difficulty": "easy",
      "points": 10
    }
    // ... AI will generate 9 more questions here ...
  ],
  "totalQuestions": 10,
  "totalPoints": 100
}
Requirements for JSON generation:
- Generate exactly 10 multiple-choice questions for the quiz.
- Ensure a mix of difficulties: approximately 3 easy, 4 medium, and 3 hard questions.
- Each question must have a unique "id" (e.g., "q1", "q2").
- Each question must have exactly 4 distinct and plausible "options".
- The "correctAnswer" must be the 0-based index (0, 1, 2, or 3) of the correct option.
- Provide a detailed and informative "explanation" for why the correct answer is correct, and briefly touch upon why other options are incorrect (if relevant).
- Each question should be worth 10 "points", making the total points 100.
- All content (questions, options, explanations) must be highly specific to "${chapterTitle}" and "${subject}", appropriate for a "${difficulty}" level.
Return ONLY the JSON object, do not include any explanatory text or markdown fences outside the JSON.`;

    const response = await this.makeRequest(prompt);

    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      if (!this.validateQuizData(parsedData)) {
        console.error("Invalid quiz data structure:", parsedData);
        throw new Error('Invalid quiz data structure received from AI. Please try again.');
      }

      // Final check for exactly 10 questions after parsing and validation
      if (parsedData.questions.length !== 10) {
        throw new Error(`AI generated ${parsedData.questions.length} questions. Expected exactly 10 questions for the quiz.`);
      }

      return parsedData;
    } catch (error) {
      console.error('JSON Parsing or Validation Error for Quiz:', error);
      throw new Error('Failed to parse or validate quiz response. Please try again.');
    }
  }

  /**
   * Provides the current status of the rate limiter.
   * Useful for debugging or providing real-time feedback in a UI.
   * @returns An object containing `canMakeRequest`, `waitTime`, and `requestsRemaining`.
   */
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

// Export an instance of the service for easy import and use throughout your application
export const geminiService = new GeminiService();