interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchResponse {
  results: TavilySearchResult[];
  query: string;
}

export class TavilyService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY environment variable is required');
    }
  }

  async searchForExposureContent(topic: string): Promise<{content: string, sources: TavilySearchResult[]}> {
    try {
      // Use Tavily's content capabilities with a focused query
      const query = `${topic} beginner tutorial introduction basics getting started`;
      
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: query,
          search_depth: 'advanced',
          include_answer: true,
          include_images: false,
          include_raw_content: true,
          max_results: 5,
          include_domains: [
            'youtube.com', 'freecodecamp.org', 'w3schools.com', 'mdn.mozilla.org',
            'reactjs.org', 'vuejs.org', 'angular.io', 'nodejs.org', 'python.org',
            'stackoverflow.com', 'github.com'
          ],
          exclude_domains: ['spam.com', 'fake-tutorials.com', 'course-sites.com']
        })
      });

      if (!response.ok) {
        console.error('Tavily exposure search failed');
        return { content: '', sources: [] };
      }

      const data: TavilySearchResponse & { answer?: string } = await response.json();
      
      // Filter and score sources
      const filteredSources = data.results
        .filter(result => 
          result.url && 
          result.title && 
          !result.url.includes('spam') &&
          !result.url.includes('fake')
        )
        .map(result => ({
          ...result,
          score: this.calculateRelevanceScore(result, topic, 'exposure')
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Top 3 sources

      // Use Tavily's answer if available, otherwise create a summary
      let content = '';
      if (data.answer) {
        content = data.answer;
      } else if (data.results.length > 0) {
        // Create a summary from the top results
        content = `Here's what you need to know about ${topic}:\n\n`;
        data.results.slice(0, 2).forEach((result, index) => {
          content += `${index + 1}. ${result.title}\n`;
          if (result.content) {
            content += `${result.content.substring(0, 200)}...\n\n`;
          }
        });
      }

      return { content, sources: filteredSources };

    } catch (error) {
      console.error('Tavily exposure search error:', error);
      return { content: '', sources: [] };
    }
  }

  async searchForExerciseTools(topic: string): Promise<TavilySearchResult[]> {
    try {
      // Create specific search queries for exercise tools/platforms
      const searchQueries = [
        `${topic} online editor free`,
        `${topic} sandbox environment`,
        `${topic} playground free`,
        `${topic} online tool free`,
        `${topic} code editor web`
      ];

      const allResults: TavilySearchResult[] = [];

      // Search for each query type
      for (const query of searchQueries) {
        try {
          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: this.apiKey,
              query: query,
              search_depth: 'basic',
              include_answer: false,
              include_images: false,
              include_raw_content: false,
              max_results: 2,
              include_domains: [],
              exclude_domains: ['spam.com', 'fake-tutorials.com']
            })
          });

          if (!response.ok) {
            console.error(`Tavily exercise search failed for query: ${query}`);
            continue;
          }

          const data: TavilySearchResponse = await response.json();
          
          // Filter and score results for exercise tools
          const filteredResults = data.results
            .filter(result => 
              result.url && 
              result.title && 
              !result.url.includes('spam') &&
              !result.url.includes('fake') &&
              (result.url.includes('editor') || 
               result.url.includes('playground') || 
               result.url.includes('sandbox') ||
               result.url.includes('tool'))
            )
            .map(result => ({
              ...result,
              score: this.calculateExerciseRelevanceScore(result, topic)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 1); // Take top 1 result per query

          allResults.push(...filteredResults);
        } catch (error) {
          console.error(`Error searching for exercise tools "${query}":`, error);
          continue;
        }
      }

      // Remove duplicates and return top results
      const uniqueResults = this.removeDuplicateUrls(allResults);
      return uniqueResults.slice(0, 2); // Return top 2 exercise tool results

    } catch (error) {
      console.error('Tavily exercise search error:', error);
      return [];
    }
  }

  private calculateRelevanceScore(result: TavilySearchResult, topic: string, resourceType: string): number {
    let score = result.score || 0;
    
    // Boost score for official documentation
    if (result.url.includes('docs.') || result.url.includes('documentation')) {
      score += 0.3;
    }
    
    // Boost score for well-known educational platforms
    const educationalDomains = [
      'github.com', 'stackoverflow.com', 'youtube.com', 'freecodecamp.org',
      'codecademy.com', 'w3schools.com', 'mdn.mozilla.org', 'reactjs.org',
      'vuejs.org', 'angular.io', 'nodejs.org', 'python.org'
    ];
    
    if (educationalDomains.some(domain => result.url.includes(domain))) {
      score += 0.2;
    }
    
    // Boost score for tutorial-related content
    if (result.title.toLowerCase().includes('tutorial') || 
        result.title.toLowerCase().includes('guide') ||
        result.title.toLowerCase().includes('learn')) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  private calculateExerciseRelevanceScore(result: TavilySearchResult, topic: string): number {
    let score = result.score || 0;
    
    // Boost score for well-known online editors and playgrounds
    const exerciseDomains = [
      'codepen.io', 'jsfiddle.net', 'codesandbox.io', 'replit.com',
      'stackblitz.com', 'glitch.com', 'jsbin.com', 'playcode.io',
      'scratch.mit.edu', 'observablehq.com'
    ];
    
    if (exerciseDomains.some(domain => result.url.includes(domain))) {
      score += 0.4;
    }
    
    // Boost score for editor/playground related content
    if (result.title.toLowerCase().includes('editor') || 
        result.title.toLowerCase().includes('playground') ||
        result.title.toLowerCase().includes('sandbox') ||
        result.title.toLowerCase().includes('online tool')) {
      score += 0.2;
    }
    
    // Boost score for free tools
    if (result.title.toLowerCase().includes('free') || 
        result.url.includes('free')) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  private removeDuplicateUrls(results: TavilySearchResult[]): TavilySearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.url)) {
        return false;
      }
      seen.add(result.url);
      return true;
    });
  }

  async searchForSpecificTool(toolName: string, topic: string): Promise<TavilySearchResult[]> {
    const query = `${toolName} ${topic} setup installation guide`;
    
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: query,
          search_depth: 'basic',
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: 3
        })
      });

      if (!response.ok) {
        return [];
      }

      const data: TavilySearchResponse = await response.json();
      return data.results.filter(result => result.url && result.title);
    } catch (error) {
      console.error('Error searching for specific tool:', error);
      return [];
    }
  }
}
