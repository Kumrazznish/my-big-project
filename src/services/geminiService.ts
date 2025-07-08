// src/services/geminiService.ts

// It's crucial to have your Gemini API key configured in a .env file
// in your project's root directory, like:
// VITE_GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
// This ensures your API key is not exposed in your public source code.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * A robust RateLimiter class designed to manage the frequency of API requests.
 * This is essential for preventing your application from exceeding the
 * rate limits imposed by external APIs like Google Gemini, which typically
 * has a quota (e.g., 60 Requests Per Minute for free tiers).
 * By controlling the request rate, you avoid receiving HTTP 429 (Too Many Requests) errors.
 */
class RateLimiter {
  // `requests` stores timestamps (in milliseconds) of all recent API requests.
  // It's used to track how many requests have been made within the `timeWindow`.
  private requests: number[] = [];

  // `maxRequests` defines the maximum number of API calls allowed within the `timeWindow`.
  // Setting it conservatively (e.g., 20) for a 60 RPM API provides a safe buffer,
  // reducing the chances of hitting the server-side rate limit.
  private readonly maxRequests = 20; // Allowing for roughly 20 requests per minute

  // `timeWindow` specifies the duration (in milliseconds) over which `maxRequests` is enforced.
  // 60000 milliseconds equals 1 minute, aligning with common API rate limits.
  private readonly timeWindow = 60000; // 1 minute (60 seconds)

  // `lastRequestTime` records the timestamp of the very last API request made.
  // This is crucial for enforcing the `minInterval` between consecutive calls.
  private lastRequestTime = 0;

  // `minInterval` dictates the minimum pause (in milliseconds) required
  // between any two successive API requests. For `maxRequests` of 20 in
  // `timeWindow` of 60 seconds, the average interval is 3000ms (60000 / 20).
  // Enforcing this minimum pause helps distribute requests more evenly
  // and prevents bursts that might still trigger rate limits, even if
  // `maxRequests` isn't hit within the full window.
  private readonly minInterval = 3000; // 3 seconds minimum between requests

  /**
   * Checks if a new API request can currently be made without violating the
   * configured rate limits. It considers both the minimum interval between
   * requests and the total number of requests within the sliding time window.
   *
   * @returns `true` if a request can be initiated; `false` otherwise.
   */
  canMakeRequest(): boolean {
    const now = Date.now(); // Current timestamp

    // First, enforce the minimum time interval between requests.
    // If not enough time has passed since the `lastRequestTime`,
    // we cannot make another request immediately.
    if (now - this.lastRequestTime < this.minInterval) {
      return false; // Request is too soon
    }

    // Next, clean up the `requests` history by removing timestamps
    // that are now outside the `timeWindow`. This maintains a record
    // only of requests relevant to the current sliding window.
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    // Finally, check if the number of requests remaining in the current
    // window is sufficient. If `requests.length` is less than `maxRequests`,
    // it means there's capacity for another call.
    return this.requests.length < this.maxRequests;
  }

  /**
   * Records that an API request has been initiated. This updates the
   * internal state of the rate limiter, adding the current timestamp
   * to the `requests` history and updating `lastRequestTime`.
   */
  recordRequest(): void {
    const now = Date.now(); // Current timestamp
    this.requests.push(now); // Add to the history of requests
    this.lastRequestTime = now; // Update the time of the most recent request
  }

  /**
   * Calculates the estimated time (in milliseconds) that the caller should
   * wait before attempting the next API request. This information is useful
   * for implementing user-facing feedback (e.g., "Please wait 5 seconds")
   * or for programmatic retry logic that respects the rate limits.
   *
   * @returns The calculated wait time in milliseconds. Returns 0 if no wait is needed.
   */
  getWaitTime(): number {
    const now = Date.now(); // Current timestamp

    // Prioritize the minimum interval wait. If this period hasn't elapsed,
    // that's the immediate reason to wait.
    const intervalWait = this.minInterval - (now - this.lastRequestTime);
    if (intervalWait > 0) {
      return intervalWait;
    }

    // If no requests have been made yet, or if we're still well within the
    // `maxRequests` limit (meaning no rate limit is currently active),
    // then no specific wait time is needed beyond the minimum interval (which is already checked).
    if (this.requests.length === 0 || this.requests.length < this.maxRequests) {
      return 0;
    }

    // If we have reached or exceeded `maxRequests` within the `timeWindow`,
    // calculate how much time needs to pass until the oldest request
    // in the window expires, freeing up a slot.
    const oldestRequest = Math.min(...this.requests); // Get the timestamp of the oldest recorded request
    const rateLimitWait = this.timeWindow - (now - oldestRequest); // Time until that oldest request falls out of the window

    // Return the maximum of 0 and the calculated wait time,
    // ensuring we don't return a negative value if the limit has already passed.
    return Math.max(0, rateLimitWait);
  }

  /**
   * Determines the number of additional requests that can be made within the
   * current `timeWindow` before hitting the `maxRequests` limit.
   *
   * @returns The count of remaining requests. Returns 0 if the limit is already reached.
   */
  getRemainingRequests(): number {
    const now = Date.now(); // Current timestamp
    // Re-filter the requests to ensure the count is accurate based on the current time
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    // Calculate the remaining capacity. Ensure it's not negative.
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Create a single instance of the RateLimiter to be used globally by the GeminiService.
const rateLimiter = new RateLimiter();

/**
 * `GeminiService` class provides a structured interface for interacting with
 * the Google Gemini API. It encapsulates complex logic such as:
 * - Sending prompts and receiving AI-generated content.
 * - Implementing sophisticated error handling for various API responses (e.g., 4xx, 5xx errors).
 * - Incorporating exponential backoff with jitter for retrying transient errors like rate limits (429)
 * and server issues (500, 503), preventing excessive retries.
 * - Enforcing a local rate-limiting mechanism using the `RateLimiter` class to
 * stay within API quotas, providing a smoother experience and reducing server-side rejections.
 * - Parsing and validating JSON responses from the AI, ensuring data integrity.
 */
export class GeminiService {

  /**
   * The core method responsible for sending a prompt to the Gemini API
   * and handling its response. This method is `private` as it's an internal
   * utility for other public methods like `generateRoadmap`, `generateCourseContent`, etc.
   *
   * @param prompt The text string containing the instruction/query for the Gemini model.
   * @param retryCount An internal parameter to track the current retry attempt (defaults to 0).
   * @returns A Promise that resolves with the AI-generated text content.
   * @throws An `Error` if the API key is missing, rate limits are consistently exceeded,
   * API returns an error, or the response structure is invalid.
   */
  private async makeRequest(prompt: string, retryCount = 0): Promise<string> {
    // Ensure the API key is available before making any network requests.
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const maxRetries = 3; // Defines the maximum number of times to retry a failed API request.
    const baseDelay = 6000; // The base delay (in milliseconds) for exponential backoff during retries.

    // === Pre-flight Rate Limit Check ===
    // Before even sending the request, check our local rate limiter.
    // This proactive check helps prevent immediately hitting limits and queueing up failed requests.
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      // If a wait time is indicated by the rate limiter, pause execution.
      if (waitTime > 0) {
        console.warn(`Rate limit active. Waiting ${Math.ceil(waitTime / 1000)} seconds before attempting request.`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // After waiting, re-evaluate if a request can now be made.
        // This is important because the wait might not fully clear the condition if many requests are queued.
        if (!rateLimiter.canMakeRequest()) {
             // If still unable to make a request after waiting, throw an error to prevent infinite loops.
             throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds and try again.`);
        }
      } else {
        // This scenario (canMakeRequest is false but waitTime is 0) should ideally not occur with correct logic,
        // but it's a fail-safe to prevent immediate re-attempts without a delay.
        throw new Error(`Rate limit exceeded. Please wait a few moments and try again.`);
      }
    }

    try {
      // Record the request with the rate limiter immediately before sending.
      // This marks a slot as used in our rate-limiting window.
      rateLimiter.recordRequest();
      console.log(`Making Gemini API request (attempt ${retryCount + 1}/${maxRetries + 1})`);

      // Construct and send the actual HTTP POST request to the Gemini API endpoint.
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Essential header for JSON body
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt // The AI prompt itself
            }]
          }],
          // Configuration for AI generation parameters
          generationConfig: {
            temperature: 0.7, // Controls randomness: lower for more deterministic, higher for more creative
            topK: 40,         // Filters the most likely tokens
            topP: 0.95,       // Nucleus sampling: selects tokens based on cumulative probability
            maxOutputTokens: 8192, // Maximum number of tokens the AI can generate in its response
          },
          // Safety settings to block content that falls into harmful categories.
          // These are important for responsible AI use.
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        })
      });

      // === API Response Handling ===
      // Check if the HTTP response indicates an error (status code outside 2xx range).
      if (!response.ok) {
        const errorText = await response.text(); // Read the error message from the response body
        console.error(`API Error ${response.status}:`, errorText);

        // Handle HTTP 429 (Too Many Requests) specifically for rate limits.
        if (response.status === 429) {
          if (retryCount < maxRetries) {
            // Apply exponential backoff with a random jitter to prevent all clients
            // from retrying at the exact same time, which could overload the server.
            const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 3000;
            console.log(`Rate limited (HTTP 429). Retrying in ${Math.ceil(delay / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay)); // Pause execution
            return this.makeRequest(prompt, retryCount + 1); // Recursively retry the request
          } else {
            // If max retries are exhausted, throw a specific error.
            throw new Error('Rate limit exceeded. Please wait a few minutes and try again.');
          }
        }

        // Handle HTTP 500 (Internal Server Error) or 503 (Service Unavailable) for server-side issues.
        if (response.status === 503 || response.status === 500) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 4000;
            console.log(`Service error (${response.status}). Retrying in ${Math.ceil(delay / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.makeRequest(prompt, retryCount + 1);
          } else {
            throw new Error('The AI service is currently experiencing issues. Please try again later.');
          }
        }

        // Attempt to parse the error message from the JSON response body
        // to provide more specific feedback (e.g., quota issues).
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            if (errorData.error.message.includes('quota') || errorData.error.message.includes('limit')) {
              throw new Error('API quota exceeded. Please wait before trying again.');
            }
            throw new Error(`API Error: ${errorData.error.message}`); // Re-throw with specific API message
          }
        } catch (parseError) {
          // If the error response is not valid JSON, or doesn't contain a specific message,
          // fall through to the generic HTTP status code handling.
        }

        // Generic error messages based on common HTTP status codes.
        switch (response.status) {
          case 400: throw new Error('Invalid request format. Please check your prompt and try again.');
          case 401: throw new Error('API authentication failed. Please check your API key and ensure it is valid.');
          case 403: throw new Error('Access forbidden. Your API key may not have sufficient permissions.');
          default: throw new Error(`Service temporarily unavailable (${response.status}). Please try again later.`);
        }
      }

      // If the response is OK (HTTP 2xx), parse the JSON body.
      const data = await response.json();

      // Validate the expected structure of the AI's successful response.
      // Gemini's responses are typically within `candidates[0].content.parts[0].text`.
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure received from AI service. Expected candidates data.');
      }
      const content = data.candidates[0].content;
      if (!content.parts || !content.parts[0] || !content.parts[0].text) {
        throw new Error('No readable text content received from AI service.');
      }

      console.log('Successfully received response from Gemini API');
      return content.parts[0].text; // Return the generated text

    } catch (error) {
      // Centralized error logging for all errors originating from `makeRequest`.
      if (error instanceof Error) {
        console.error('Gemini API Request Failed:', error.message);
        throw error; // Re-throw the error to be handled by the caller
      } else {
        console.error('An unexpected non-Error object was thrown during Gemini API communication:', error);
        throw new Error('An unexpected error occurred while communicating with the AI service.');
      }
    }
  }

  /**
   * Cleans a raw string response from the Gemini API, primarily by removing
   * markdown code block fences (like '```json' or '```'). This is common
   * when AI models generate JSON output wrapped in markdown.
   * It also attempts to trim and extract the pure JSON object string.
   *
   * @param response The raw string output received from the AI model.
   * @returns A cleaned string that should represent valid JSON.
   */
  private cleanJsonResponse(response: string): string {
    // Remove markdown code block fences (e.g., ```json\n, ```\n)
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.trim(); // Remove leading/trailing whitespace

    // Further refinement: try to find the actual JSON object bounds ({...})
    // in case there's any preceding or trailing non-JSON text.
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      // Extract only the content between and including the first and last braces.
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned.trim(); // Final trim
  }

  /**
   * Validates the structure of a parsed JSON object to ensure it conforms
   * to the expected schema for a learning roadmap. This helps catch cases
   * where the AI might deviate from the requested output format.
   *
   * @param data The JavaScript object parsed from the AI's JSON response.
   * @returns `true` if the data structure is valid; `false` otherwise.
   */
  private validateRoadmapData(data: any): boolean {
    // Extensive checks to ensure all required fields are present and of the correct type.
    return (
      data && // Check if data exists
      typeof data === 'object' && // Check if data is an object
      typeof data.subject === 'string' &&
      typeof data.difficulty === 'string' &&
      typeof data.description === 'string' &&
      Array.isArray(data.chapters) && // Ensure 'chapters' is an array
      data.chapters.length > 0 && // Ensure 'chapters' array is not empty
      data.chapters.every((chapter: any) => // Validate each chapter object
        typeof chapter.id === 'string' &&
        typeof chapter.title === 'string' &&
        typeof chapter.description === 'string' &&
        typeof chapter.duration === 'string' &&
        typeof chapter.position === 'string' &&
        Array.isArray(chapter.keyTopics) && // Ensure these are arrays
        Array.isArray(chapter.skills) &&
        Array.isArray(chapter.practicalProjects)
        // You could add more checks here, e.g., chapter.keyTopics.every(topic => typeof topic === 'string')
      )
    );
  }

  /**
   * Validates the structure of a parsed JSON object to ensure it conforms
   * to the expected schema for detailed course content.
   *
   * @param data The JavaScript object parsed from the AI's JSON response.
   * @returns `true` if the data structure is valid; `false` otherwise.
   */
  private validateCourseContent(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      typeof data.description === 'string' &&
      data.content && // Check for the presence of the 'content' object
      typeof data.content === 'object' &&
      typeof data.content.introduction === 'string' &&
      typeof data.content.mainContent === 'string' &&
      Array.isArray(data.content.keyPoints) &&
      typeof data.content.summary === 'string'
    );
  }

  /**
   * Validates the structure of a parsed JSON object to ensure it conforms
   * to the expected schema for a quiz.
   *
   * @param data The JavaScript object parsed from the AI's JSON response.
   * @returns `true` if the data structure is valid; `false` otherwise.
   */
  private validateQuizData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      Array.isArray(data.questions) && // Ensure 'questions' is an array
      data.questions.length > 0 && // Ensure 'questions' array is not empty
      data.questions.every((question: any) => // Validate each question object
        typeof question.id === 'string' &&
        typeof question.question === 'string' &&
        Array.isArray(question.options) &&
        question.options.length === 4 && // Ensure exactly 4 options
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 && question.correctAnswer < 4 && // Correct answer index must be 0-3
        typeof question.explanation === 'string' &&
        typeof question.difficulty === 'string' &&
        typeof question.points === 'number'
      )
    );
  }

  /**
   * Generates a comprehensive learning roadmap for a specified subject and difficulty level.
   * It leverages user learning preferences stored in localStorage to personalize the roadmap.
   *
   * @param subject The academic or technical subject for which to generate the roadmap (e.g., "Web Development").
   * @param difficulty The desired difficulty level of the roadmap (e.g., "beginner", "intermediate", "advanced").
   * @returns A Promise that resolves with the parsed and validated roadmap data as a JavaScript object.
   * @throws An Error if rate limits are hit, API key is missing, or the AI's response is invalid.
   */
  async generateRoadmap(subject: string, difficulty: string): Promise<any> {
    console.log('Initiating roadmap generation for:', { subject, difficulty });

    // Perform an immediate client-side rate limit check. This gives quick feedback
    // to the user without making an unnecessary API call if limits are active.
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }

    // Retrieve any stored learning preferences from local storage.
    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');

    // Construct the detailed prompt for the Gemini AI.
    // It explicitly requests JSON in a specific format to guide the AI's output.
    const prompt = `Create a comprehensive learning roadmap for "${subject}" at "${difficulty}" level, tailored to the following user learning preferences:
- Learning Style: ${preferences.learningStyle || 'mixed'}
- Time Commitment: ${preferences.timeCommitment || 'regular'}
- Goals: ${preferences.goals?.join(', ') || 'general learning'}
The roadmap must be highly detailed, practical, and structured, covering key topics, skills, and practical projects for each chapter.
Return ONLY valid JSON in this exact format. Ensure all fields are populated correctly, realistically, and are specific to the requested subject and difficulty.

\`\`\`json
{
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "description": "Comprehensive ${subject} learning path designed for ${difficulty} level learners, with a strong focus on practical skills development and project-based application of knowledge. This roadmap guides you from foundational concepts to advanced topics, ensuring a solid understanding and hands-on experience.",
  "totalDuration": "8-12 weeks",
  "estimatedHours": "40-60 hours",
  "prerequisites": ["Basic computer skills", "Reliable internet access", "A code editor (e.g., VS Code)", "Foundational understanding of problem-solving"],
  "learningOutcomes": [
    "Master the fundamental concepts and advanced techniques of ${subject}.",
    "Develop proficiency in applying ${subject} principles to build functional projects.",
    "Understand and implement industry best practices and design patterns in ${subject}.",
    "Enhance problem-solving abilities through practical coding challenges.",
    "Gain confidence in independently researching and learning new ${subject}-related topics."
  ],
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Introduction to ${subject} Fundamentals",
      "description": "Begin your journey by understanding the core concepts, historical context, and essential terminology of ${subject}. Learn how to set up your development environment and execute your first basic programs or tasks.",
      "duration": "1 week",
      "estimatedHours": "4-6 hours",
      "difficulty": "beginner",
      "position": "left",
      "completed": false,
      "keyTopics": ["Overview of ${subject}", "Setup & Installation", "Basic Syntax", "Variables & Data Types", "Input/Output Operations"],
      "skills": ["Environment Setup", "Basic Coding Syntax", "Program Execution", "Understanding Core Concepts"],
      "practicalProjects": ["'Hello World' Application", "Simple Data Display Program"],
      "resources": 5
    },
    {
      "id": "chapter-2",
      "title": "Control Flow and Functions in ${subject}",
      "description": "Learn how to control the flow of your programs using conditional statements and loops. Master the art of writing reusable code with functions, understanding parameters, return values, and scope.",
      "duration": "1 week",
      "estimatedHours": "5-7 hours",
      "difficulty": "beginner",
      "position": "right",
      "completed": false,
      "keyTopics": ["Conditional Statements (if/else, switch)", "Looping Constructs (for, while, do-while)", "Function Definition", "Function Parameters & Return Values", "Scope (Local vs. Global)"],
      "skills": ["Logical Programming", "Modular Code Design", "Problem Decomposition", "Debugging Control Flow"],
      "practicalProjects": ["Simple Calculator", "Guess the Number Game"],
      "resources": 6
    },
    {
      "id": "chapter-3",
      "title": "Data Structures and Collections in ${subject}",
      "description": "Explore fundamental data structures like arrays, lists, dictionaries/objects, and sets. Understand their properties, use cases, and how to effectively store and manipulate collections of data in ${subject}.",
      "duration": "1 week",
      "estimatedHours": "5-7 hours",
      "difficulty": "beginner",
      "position": "left",
      "completed": false,
      "keyTopics": ["Arrays/Lists", "Objects/Dictionaries/Maps", "Sets", "Traversing Collections", "Adding/Removing Elements"],
      "skills": ["Data Organization", "Efficient Data Access", "Iterating Over Data", "Choosing Appropriate Structures"],
      "practicalProjects": ["Contact List Manager", "Simple Inventory System"],
      "resources": 5
    },
    {
      "id": "chapter-4",
      "title": "Object-Oriented Programming (OOP) in ${subject}",
      "description": "Dive into the principles of Object-Oriented Programming. Learn about classes, objects, inheritance, polymorphism, and encapsulation, and how they apply to building structured and reusable code in ${subject}.",
      "duration": "1 week",
      "estimatedHours": "6-8 hours",
      "difficulty": "intermediate",
      "position": "right",
      "completed": false,
      "keyTopics": ["Classes & Objects", "Constructors", "Methods & Properties", "Encapsulation", "Inheritance", "Polymorphism"],
      "skills": ["OOP Design Principles", "Creating Reusable Components", "Code Organization", "Abstraction"],
      "practicalProjects": ["Simple Bank Account System", "Basic RPG Game (Object-based)"],
      "resources": 7
    },
    {
      "id": "chapter-5",
      "title": "Error Handling and Debugging in ${subject}",
      "description": "Understand how to anticipate and handle errors gracefully in your ${subject} applications. Learn effective debugging techniques and tools to identify and fix issues efficiently.",
      "duration": "0.5 week",
      "estimatedHours": "3-5 hours",
      "difficulty": "intermediate",
      "position": "left",
      "completed": false,
      "keyTopics": ["Types of Errors", "Try-Catch Blocks", "Custom Errors", "Logging", "Debugging Tools & Strategies", "Stack Traces"],
      "skills": ["Error Management", "Debugging Proficiency", "Robust Code Development", "Problem Isolation"],
      "practicalProjects": ["Refactor a previous project with error handling", "Build a small CLI tool with robust input validation"],
      "resources": 4
    },
    {
      "id": "chapter-6",
      "title": "Modules and Packages in ${subject}",
      "description": "Learn how to organize your ${subject} code into modular units and leverage external packages or libraries. Understand dependency management and how to integrate third-party tools.",
      "duration": "0.5 week",
      "estimatedHours": "3-5 hours",
      "difficulty": "intermediate",
      "position": "right",
      "completed": false,
      "keyTopics": ["Module System", "Import/Export Syntax", "Package Managers", "Dependency Installation", "Using External Libraries"],
      "skills": ["Code Organization", "Dependency Management", "Leveraging Ecosystem", "Third-party Integration"],
      "practicalProjects": ["Use an external library for data manipulation", "Create a multi-file project structure"],
      "resources": 4
    },
    {
      "id": "chapter-7",
      "title": "Asynchronous Programming in ${subject}",
      "description": "Master asynchronous concepts like Promises, Async/Await, and callbacks, crucial for handling non-blocking operations and I/O in modern ${subject} applications.",
      "duration": "1 week",
      "estimatedHours": "6-8 hours",
      "difficulty": "intermediate",
      "position": "left",
      "completed": false,
      "keyTopics": ["Callbacks", "Promises (Creation & Chaining)", "Async/Await", "Error Handling in Async Code", "Event Loop Concepts"],
      "skills": ["Non-Blocking Operations", "API Integration", "Concurrency Patterns", "Handling Network Requests"],
      "practicalProjects": ["Fetch data from a public API", "Implement a simple async task queue"],
      "resources": 6
    },
    {
      "id": "chapter-8",
      "title": "Introduction to Web Development with ${subject} (Frontend/Backend)",
      "description": "Gain an initial understanding of how ${subject} interfaces with web technologies. Depending on relevance, this could cover basic server-side setup or client-side interaction.",
      "duration": "1 week",
      "estimatedHours": "7-9 hours",
      "difficulty": "intermediate",
      "position": "right",
      "completed": false,
      "keyTopics": ["HTTP Basics", "Web Servers (e.g., Node.js/Express, Flask/Django)", "REST APIs (Consumers/Producers)", "Basic Templating/Rendering"],
      "skills": ["Client-Server Communication", "Building Simple APIs", "Handling Web Requests", "Data Exchange"],
      "practicalProjects": ["Build a simple web server returning JSON", "Create a basic 'to-do' web app"],
      "resources": 7
    },
    {
      "id": "chapter-9",
      "title": "Working with Databases in ${subject}",
      "description": "Learn how to store and retrieve data persistently using databases. This chapter covers basic database concepts, connecting from ${subject}, and performing CRUD operations.",
      "duration": "1 week",
      "estimatedHours": "6-8 hours",
      "difficulty": "advanced",
      "position": "left",
      "completed": false,
      "keyTopics": ["Database Concepts (SQL/NoSQL)", "Connecting to Databases", "CRUD Operations (Create, Read, Update, Delete)", "Database Drivers/ORMs"],
      "skills": ["Data Persistence", "Database Interaction", "Querying Data", "Schema Design Basics"],
      "practicalProjects": ["Build an app that stores data in a local database", "User authentication system with a database"],
      "resources": 6
    },
    {
      "id": "chapter-10",
      "title": "Advanced ${subject} Topics and Best Practices",
      "description": "Delve into more advanced features, performance optimization, and professional development practices within ${subject}. This prepares you for complex real-world applications.",
      "duration": "1 week",
      "estimatedHours": "6-8 hours",
      "difficulty": "advanced",
      "position": "right",
      "completed": false,
      "keyTopics": ["Design Patterns", "Performance Optimization", "Testing (Unit, Integration)", "Code Reviews", "Deployment Basics"],
      "skills": ["Optimized Coding", "Test-Driven Development", "Collaborative Coding", "Deployment Fundamentals"],
      "practicalProjects": ["Optimize a previous project for performance", "Add unit tests to an existing codebase"],
      "resources": 7
    },
    {
      "id": "chapter-11",
      "title": "Capstone Project: Real-World Application with ${subject}",
      "description": "Apply all your acquired knowledge to build a substantial, end-to-end project. This chapter emphasizes independent problem-solving, integration of various concepts, and project deployment.",
      "duration": "2 weeks",
      "estimatedHours": "10-15 hours",
      "difficulty": "advanced",
      "position": "left",
      "completed": false,
      "keyTopics": ["Project Planning", "Architecture Design", "Full-Stack Integration (if applicable)", "Deployment", "Version Control (Git)"],
      "skills": ["Full Project Lifecycle", "Independent Development", "Complex Problem Solving", "Debugging Large Systems"],
      "practicalProjects": ["Develop a comprehensive web application", "Create a data analysis pipeline"],
      "resources": 8
    }
  ]
}
\`\`\`
Requirements for the generated JSON:
- The roadmap must contain exactly 10 to 12 chapters.
- Each chapter's "id" must be unique (e.g., "chapter-1", "chapter-2", etc.).
- The "position" field for each chapter must strictly alternate between "left" and "right".
- Chapter difficulties should progressively increase, starting with "beginner" and moving towards "intermediate" and "advanced".
- "duration" and "estimatedHours" for each chapter must be realistic and appropriate for the content.
- "keyTopics", "skills", and "practicalProjects" arrays within each chapter must contain at least 3 items, be highly specific, actionable, and directly relevant to the chapter's title and the overall subject/difficulty.
- The "completed" field for all chapters must be `false`.
- The overall "totalDuration" and "estimatedHours" should be a plausible sum reflecting the commitment for all chapters.
- **Important:** Ensure the output is ONLY the JSON object, wrapped in a single markdown JSON block (\`\`\`json ... \`\`\`), with no extra text or markdown outside these specific boundaries.
`;

    // Make the API request using the private helper method.
    const response = await this.makeRequest(prompt);

    try {
      // Clean the AI's response to ensure it's pure JSON, then parse it.
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      // Validate the parsed data against the expected roadmap structure.
      if (!this.validateRoadmapData(parsedData)) {
        console.error("Invalid roadmap data structure received:", parsedData);
        throw new Error('Invalid roadmap data structure received from AI. Please check the AI output format and try again.');
      }

      // Add a specific validation for the number of chapters generated.
      if (parsedData.chapters.length < 10 || parsedData.chapters.length > 12) {
        throw new Error(`AI generated ${parsedData.chapters.length} chapters. Expected between 10 and 12 chapters for the roadmap.`);
      }

      return parsedData; // Return the valid roadmap data.
    } catch (error) {
      console.error('JSON Parsing or Validation Error for Roadmap:', error);
      // Re-throw a user-friendly error message.
      throw new Error('Failed to parse or validate roadmap response. This might be due to an AI generation error. Please try again.');
    }
  }

  /**
   * Generates comprehensive course content for a specific chapter within a subject.
   * This includes detailed explanations, code examples, exercises, and resources.
   *
   * @param chapterTitle The specific title of the chapter for which content is needed.
   * @param subject The overall subject area (e.g., "Python Programming").
   * @param difficulty The difficulty level relevant to this chapter's content.
   * @returns A Promise that resolves with the parsed and validated course content data.
   * @throws An Error if rate limits are hit, API key is missing, or the AI's response is invalid.
   */
  async generateCourseContent(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    console.log('Initiating course content generation for:', { chapterTitle, subject, difficulty });

    // Client-side rate limit check for immediate user feedback.
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }
    const preferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');

    /**
     * Helper function to select a relevant YouTube video ID based on subject and chapter.
     * In a real-world application, this might involve a more dynamic search or
     * integration with the YouTube Data API. For this example, it uses a static map.
     *
     * @param subj The main subject.
     * @param chapter The specific chapter title.
     * @returns A YouTube video ID string.
     */
    const getYouTubeVideoId = (subj: string, chapter: string): string => {
      // Mapping common subjects/topics to illustrative educational YouTube video IDs.
      const videoMappings: { [key: string]: string } = {
        'programming': 'rfscVS0vtbw', // Learn Programming in 10 Minutes - Mosh
        'web-development': 'UB1O30fR-EE', // HTML, CSS, JS Explained - Traversy Media
        'javascript': 'PkZNo7MFNFg', // Learn JavaScript - freeCodeCamp.org
        'python': 'kqtD5dpn9C8', // Python for Beginners - Mosh
        'react': 'Ke90Tje7VS0', // React Tutorial - freeCodeCamp.org
        'data-science': 'ua-CiDNNj30', // What is Data Science? - IBM Technology
        'machine-learning': 'ukzFI9rgwfU', // What is Machine Learning? - IBM Technology
        'design': 'YiLUYf4HDh4', // UI/UX Design Full Course - CareerFoundry
        'mathematics': 'WUvTyaaNkzM', // The Map of Mathematics - Quanta Magazine
        'business': 'SlteusaKev4' // What is Business Strategy? - Harvard Business Review
      };

      // Attempt to find the most relevant video by checking both subject and chapter title keywords.
      const subjectKey = Object.keys(videoMappings).find(key =>
        subj.toLowerCase().includes(key) || chapter.toLowerCase().includes(key)
      );

      // Return the found video ID or a default (e.g., a "Rickroll" for fun, or just an empty string).
      return videoMappings[subjectKey] || 'dQw4w9WgXcQ'; // Default fallback video ID
    };
    const videoId = getYouTubeVideoId(subject, chapterTitle);

    // Construct the detailed prompt for generating chapter-specific course content.
    // The prompt guides the AI to produce well-structured JSON with various content sections.
    const prompt = `Create comprehensive and highly detailed course content for the chapter titled "${chapterTitle}" within a "${subject}" learning path at a "${difficulty}" level. The content should be educational, practical, and structured, suitable for the specified audience.
Include specific learning objectives, estimated time for completion, an extensive 'mainContent' section, key takeaways, relevant code examples with explanations, practical exercises, and additional resources.
Return ONLY valid JSON in this exact format. Ensure all fields are fully populated and specific to the chapter and subject.

\`\`\`json
{
  "title": "${chapterTitle}",
  "description": "An in-depth guide to ${chapterTitle} as a core concept in ${subject}, tailored for ${difficulty} level learners. This section provides a thorough understanding of its theoretical foundations, practical applications, and best practices.",
  "learningObjectives": [
    "To thoroughly comprehend the fundamental concepts and principles underlying ${chapterTitle}.",
    "To acquire the ability to practically implement and utilize ${chapterTitle} in various coding scenarios.",
    "To master key techniques, design patterns, and tools associated with effective ${chapterTitle} usage.",
    "To develop problem-solving skills by applying ${chapterTitle} to real-world challenges and examples."
  ],
  "estimatedTime": "4-6 hours",
  "content": {
    "introduction": "This chapter serves as a comprehensive introduction to ${chapterTitle} within the context of ${subject}. We will begin by defining what ${chapterTitle} entails, exploring its historical significance, and understanding why it is a critical component of ${subject} development. You will learn how ${chapterTitle} fits into the broader ecosystem of ${subject} and its role in building robust and scalable applications. Prepare for a deep dive into both the theory and practical application of this essential topic.",
    "mainContent": "The main content of this chapter provides an exhaustive exploration of ${chapterTitle}. We will break down complex ideas into digestible segments, starting with the absolute basics and progressing to more nuanced applications.
    
    1.  **Core Concepts and Theory**: A detailed explanation of the theoretical underpinnings of ${chapterTitle}. This includes its definition, associated terminology, and conceptual models. We will discuss foundational principles that govern its behavior and use.
    2.  **Syntax and Implementation**: Practical walkthroughs of how ${chapterTitle} is implemented in ${subject}. This covers specific syntax rules, common structures, and variations across different contexts. Numerous code snippets and examples will illustrate correct usage.
    3.  **Advanced Techniques and Patterns**: Explore more sophisticated ways to utilize ${chapterTitle}, including advanced patterns, optimization strategies, and common pitfalls to avoid. We will look at how ${chapterTitle} interacts with other ${subject} features.
    4.  **Real-World Applications**: Case studies and examples demonstrating how ${chapterTitle} is applied in actual ${subject} projects. This section bridges theory with practice, showing its relevance in building functional software.
    5.  **Troubleshooting and Debugging**: Common errors and challenges encountered when working with ${chapterTitle}. Practical advice and strategies for diagnosing and resolving issues efficiently.
    
    This section is designed to provide both a deep theoretical understanding and actionable practical skills, ensuring you can confidently apply ${chapterTitle} in your own ${subject} projects.",
    "keyPoints": [
      "Fundamental definition and purpose of ${chapterTitle} in ${subject}.",
      "Correct syntax and common implementation patterns for ${chapterTitle}.",
      "Understanding advanced concepts and effective usage scenarios.",
      "Strategies for debugging and handling errors related to ${chapterTitle}.",
      "Practical application and integration of ${chapterTitle} in larger projects."
    ],
    "summary": "In this chapter, you have gained a comprehensive understanding of ${chapterTitle} in ${subject}. You are now equipped with the theoretical knowledge and practical skills to confidently apply ${chapterTitle} in your development work, troubleshoot issues, and leverage its full potential in building robust ${subject} applications."
  },
  "videoId": \`https://www.youtube.com/watch?v=$$${videoId}\`,
  "codeExamples": [
    {
      "title": "Basic ${chapterTitle} Usage Example",
      "code": "// This is a simple example demonstrating the core usage of ${chapterTitle} in ${subject}.\n// It illustrates the basic syntax and a straightforward application.\n\nfunction calculateSum(a, b) {\n  // Using ${chapterTitle} principle: simple addition\n  return a + b;\n}\n\nlet num1 = 5;\nlet num2 = 10;\nlet result = calculateSum(num1, num2);\n\nconsole.log(\`The sum of \${num1} and \${num2} is: \${result}\`);\n\n// Another basic use case for ${chapterTitle}\nconst greeting = \`Hello from \${subject} and \${chapterTitle}!\`;\nconsole.log(greeting);",
      "explanation": "This example showcases the fundamental syntax and purpose of ${chapterTitle}. The `calculateSum` function demonstrates a basic operation, while the `greeting` constant illustrates string interpolation, both directly related to core concepts discussed in this chapter about ${subject}."
    },
    {
      "title": "Advanced ${chapterTitle} Pattern/Implementation",
      "code": "// This example demonstrates a more advanced pattern or practical implementation of ${chapterTitle}.\n// It shows how ${chapterTitle} can be used in a more complex scenario within ${subject}.\n\nclass UserManager {\n  constructor() {\n    this.users = [];\n  }\n\n  addUser(name, email) {\n    const newUser = { id: this.users.length + 1, name, email };\n    this.users.push(newUser);\n    console.log(\`User \${name} added using ${chapterTitle} principles.\`);\n  }\n\n  findUser(id) {\n    // Advanced usage of array methods combined with ${chapterTitle} logic\n    return this.users.find(user => user.id === id);\n  }\n\n  listAllUsers() {\n    console.log(\`Current users (${chapterTitle} context):\`);\n    this.users.forEach(user => console.log(`- ID: \${user.id}, Name: \${user.name}`));\n  }\n}\n\nconst userManager = new UserManager();\nuserManager.addUser('Alice', 'alice@example.com');\nuserManager.addUser('Bob', 'bob@example.com');\nuserManager.listAllUsers();\nconst foundUser = userManager.findUser(1);\nconsole.log('Found user:', foundUser);\n",
      "explanation": "This advanced example illustrates how ${chapterTitle} principles are applied in a class-based structure for managing user data. It demonstrates object instantiation, array manipulation, and method invocation, highlighting practical object-oriented design and data handling within ${subject} using concepts from this chapter."
    }
  ],
  "practicalExercises": [
    {
      "title": "Exercise 1: Implement a Data Transformation Function",
      "description": "Create a function that takes an array of numbers and uses ${chapterTitle} concepts to return a new array where each number is squared. Focus on immutability and functional approaches if applicable to ${subject}.",
      "difficulty": "easy"
    },
    {
      "title": "Exercise 2: Build a Simple Command-Line Utility",
      "description": "Develop a small command-line utility that takes user input for a simple task (e.g., converting units, calculating an area) and uses ${chapterTitle} to structure the logic for different operations. Ensure robust error handling for invalid inputs.",
      "difficulty": "medium"
    }
  ],
  "additionalResources": [
    {
      "title": "Official ${subject} Documentation: ${chapterTitle}",
      "url": "https://developer.mozilla.org/en-US/docs/Web/${subject}/Reference/Statements/${chapterTitle.replace(/\\s+/g, '')}",
      "type": "documentation",
      "description": "The authoritative reference for all syntax and detailed behavior of ${chapterTitle} directly from the official ${subject} documentation."
    },
    {
      "title": "In-Depth Guide to ${chapterTitle} on [Relevant Tech Blog/Platform]",
      "url": "https://www.freecodecamp.org/news/search?query=${chapterTitle.replace(/\\s+/g, '-').toLowerCase()}-guide",
      "type": "tutorial",
      "description": "A comprehensive tutorial that provides a different perspective and practical examples on ${chapterTitle}, often with real-world scenarios."
    }
  ],
  "nextSteps": [
    "Dedicate time to thoroughly practice all suggested exercises and try to solve them in multiple ways.",
    "Actively experiment with the provided code examples: modify them, break them, and fix them to deepen your understanding.",
    "Explore the additional resources, especially the official documentation, to expand your knowledge beyond the course material.",
    "Start conceptualizing and building a small personal project that heavily relies on the concepts of ${chapterTitle} to solidify your practical skills."
  ]
}
\`\`\`
Make the 'content.mainContent' section genuinely extensive and detailed, providing a thorough breakdown of at least 5 key sub-points related to the chapter.
Ensure all generated fields are highly specific to "${chapterTitle}" and "${subject}" at the "${difficulty}" level.
All arrays within the JSON (e.g., `learningObjectives`, `keyPoints`, `codeExamples`, `practicalExercises`, `additionalResources`) must contain at least 2 highly relevant and distinct items.
**Important:** Return ONLY the JSON object, wrapped in a single markdown JSON block (\`\`\`json ... \`\`\`), with no extra text or markdown outside these specific boundaries.`;

    // Make the API request.
    const response = await this.makeRequest(prompt);

    try {
      // Clean and parse the AI's JSON response.
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      // Validate the parsed data against the expected course content structure.
      if (!this.validateCourseContent(parsedData)) {
        console.error("Invalid course content data structure received:", parsedData);
        throw new Error('Invalid course content structure received from AI. Please check the AI output format and try again.');
      }

      return parsedData; // Return the valid course content.
    } catch (error) {
      console.error('JSON Parsing or Validation Error for Course Content:', error);
      throw new Error('Failed to parse or validate course content. This might be due to an AI generation error. Please try again.');
    }
  }

  /**
   * Generates a comprehensive multiple-choice quiz for a specific chapter within a subject.
   * The quiz is designed to test understanding at a given difficulty level.
   *
   * @param chapterTitle The title of the chapter for which the quiz is to be generated.
   * @param subject The overarching subject of the learning path.
   * @param difficulty The desired difficulty level for the quiz questions (e.g., "easy", "medium", "hard").
   * @returns A Promise that resolves with the parsed and validated quiz data.
   * @throws An Error if rate limits are hit, API key is missing, or the AI's response is invalid.
   */
  async generateQuiz(chapterTitle: string, subject: string, difficulty: string): Promise<any> {
    console.log('Initiating quiz generation for:', { chapterTitle, subject, difficulty });

    // Client-side rate limit check for immediate user feedback.
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }

    // Construct the prompt for the Gemini AI to generate a quiz.
    // The prompt is highly specific about the number of questions, options, and explanation requirements.
    const prompt = `Create a comprehensive multiple-choice quiz for the chapter titled "${chapterTitle}" within a "${subject}" learning path at a "${difficulty}" level.
The quiz should be challenging yet fair, with clear questions, four plausible distractors for each question, and detailed explanations for the correct answers.
Return ONLY valid JSON in this exact format. Ensure all fields are fully populated and specific to the chapter and subject.

\`\`\`json
{
  "chapterId": "quiz-for-${chapterTitle.toLowerCase().replace(/\\s+/g, '-')}",
  "title": "Quiz: ${chapterTitle} in ${subject}",
  "description": "Test your understanding of the key concepts and practical applications covered in the '${chapterTitle}' chapter of ${subject}. This quiz assesses your knowledge from fundamental principles to more advanced problem-solving, relevant to the ${difficulty} level.",
  "timeLimit": 600, // Time limit for the quiz in seconds (10 minutes)
  "passingScore": 70, // Required percentage to pass the quiz
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Which of the following best describes the purpose of a 'loop' in ${subject} programming, as explained in ${chapterTitle}?",
      "options": [
        "To declare a new variable.",
        "To define a reusable block of code.",
        "To repeatedly execute a block of code until a condition is met.",
        "To handle errors gracefully in a program."
      ],
      "correctAnswer": 2,
      "explanation": "The correct answer is C. Loops (like `for` or `while` loops) are fundamental control flow structures in programming languages like ${subject}. Their primary purpose is to automate repetitive tasks by executing a specific block of code multiple times, based on a defined condition. This significantly reduces code duplication and improves efficiency.",
      "difficulty": "easy",
      "points": 10
    },
    {
      "id": "q2",
      "type": "multiple-choice",
      "question": "In ${subject}, if you need to store a collection of unique items without any specific order, which data structure, covered in ${chapterTitle}, is most appropriate?",
      "options": [
        "Array",
        "Object",
        "Set",
        "Map"
      ],
      "correctAnswer": 2,
      "explanation": "The correct answer is C, Set. In ${subject} (and many other languages), a Set is a collection of unique values. Unlike Arrays, Sets do not allow duplicate entries, and the order of elements is generally not guaranteed. Objects are for key-value pairs, Arrays are ordered collections (allowing duplicates), and Maps are key-value pairs with any type of key.",
      "difficulty": "medium",
      "points": 10
    },
    {
      "id": "q3",
      "type": "multiple-choice",
      "question": "Consider a scenario in ${subject} where you are consuming an external API that might occasionally return a '503 Service Unavailable' error. Based on best practices for asynchronous programming in ${chapterTitle}, what is the most robust strategy to handle this?",
      "options": [
        "Immediately re-throw the error to crash the application, indicating a critical failure.",
        "Implement a 'try-catch' block and log the error, then continue execution without retrying.",
        "Use exponential backoff with jitter to retry the API call multiple times with increasing delays.",
        "Switch to a synchronous API call to avoid network latency issues."
      ],
      "correctAnswer": 2,
      "explanation": "The correct answer is C. For transient network errors like '503 Service Unavailable', implementing an exponential backoff strategy with jitter is a highly robust approach. This means retrying the request after increasingly longer delays, plus a small random component (jitter) to prevent multiple clients from retrying simultaneously and overwhelming the server. Options A and B are less resilient, and option D is often not feasible or desirable for external API calls.",
      "difficulty": "hard",
      "points": 10
    }
    // ... AI will generate 7 more questions here ...
  ],
  "totalQuestions": 10,
  "totalPoints": 100
}
\`\`\`
Requirements for the generated JSON:
- The quiz **must** contain exactly 10 unique multiple-choice questions.
- The questions should have a balanced mix of difficulties: aim for approximately 3 easy, 4 medium, and 3 hard questions.
- Each question must have a unique "id" (e.g., "q1", "q2", ..., "q10").
- Each question must strictly contain exactly 4 distinct and plausible "options" (answer choices).
- The "correctAnswer" field must be the 0-based index (0, 1, 2, or 3) corresponding to the correct option.
- A detailed and informative "explanation" must be provided for each question, clarifying why the correct answer is right and briefly why other options are incorrect or less suitable.
- Each question should be worth 10 "points", ensuring the "totalPoints" sum up to 100.
- All content (questions, options, explanations) must be highly specific to the concepts covered in "${chapterTitle}" and relevant to "${subject}", and appropriate for the "${difficulty}" level.
- **Important:** Return ONLY the JSON object, wrapped in a single markdown JSON block (\`\`\`json ... \`\`\`), with no extra text or markdown outside these specific boundaries.`;

    // Make the API request.
    const response = await this.makeRequest(prompt);

    try {
      // Clean and parse the AI's JSON response.
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);

      // Validate the parsed data against the expected quiz structure.
      if (!this.validateQuizData(parsedData)) {
        console.error("Invalid quiz data structure received:", parsedData);
        throw new Error('Invalid quiz data structure received from AI. Please check the AI output format and try again.');
      }

      // Final critical validation: ensure exactly 10 questions were generated.
      if (parsedData.questions.length !== 10) {
        throw new Error(`AI generated ${parsedData.questions.length} questions. Expected exactly 10 questions for the quiz.`);
      }

      return parsedData; // Return the valid quiz data.
    } catch (error) {
      console.error('JSON Parsing or Validation Error for Quiz:', error);
      throw new Error('Failed to parse or validate quiz response. This might be due to an AI generation error. Please try again.');
    }
  }

  /**
   * Provides the current status of the internal rate limiter.
   * This method can be called by UI components to display real-time
   * information to the user about API request availability.
   *
   * @returns An object containing `canMakeRequest` (boolean), `waitTime` (milliseconds),
   * and `requestsRemaining` (number).
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

// Export a single, ready-to-use instance of the GeminiService.
// This is a common pattern in TypeScript/JavaScript to ensure a singleton
// service across your application.
export const geminiService = new GeminiService();