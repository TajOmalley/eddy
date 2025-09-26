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

  async searchForLearningResources(topic: string, resourceType: string = 'tutorial'): Promise<TavilySearchResult[]> {
    try {
      // Create specific search queries for different types of learning resources
      const searchQueries = [
        `${topic} ${resourceType} free online`,
        `${topic} beginner tutorial`,
        `${topic} documentation official`,
        `${topic} course free`,
        `${topic} examples github`
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
              max_results: 3,
              include_domains: [],
              exclude_domains: ['spam.com', 'fake-tutorials.com']
            })
          });

          if (!response.ok) {
            console.error(`Tavily search failed for query: ${query}`);
            continue;
          }

          const data: TavilySearchResponse = await response.json();
          
          // Filter and score results
          const filteredResults = data.results
            .filter(result => 
              result.url && 
              result.title && 
              !result.url.includes('spam') &&
              !result.url.includes('fake')
            )
            .map(result => ({
              ...result,
              score: this.calculateRelevanceScore(result, topic, resourceType)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 2); // Take top 2 results per query

          allResults.push(...filteredResults);
        } catch (error) {
          console.error(`Error searching for query "${query}":`, error);
          continue;
        }
      }

      // Remove duplicates and return top results
      const uniqueResults = this.removeDuplicateUrls(allResults);
      return uniqueResults.slice(0, 5); // Return top 5 unique results

    } catch (error) {
      console.error('Tavily search error:', error);
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
