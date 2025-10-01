# LearnCanvas

A modern, hands-on learning platform that creates personalized projects for beginners using AI.

## Features

- **Canvas-style Interface**: Clean, distraction-free learning environment
- **AI-Powered Project Generation**: Creates step-by-step projects using OpenAI
- **Real-time Content Search**: Uses Tavily to find verified learning resources
- **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Tavily API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   ```
   
   **Getting API Keys:**
   - **OpenAI**: Get your API key from [platform.openai.com](https://platform.openai.com)
   - **Tavily**: Get your API key from [tavily.com](https://tavily.com) or use your MCP configuration

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### Learning Structure
Each learning project follows a structured approach:

1. **Exposure**: Key concepts and information from verified sources
2. **Exercise**: Hands-on project with methodical step-by-step instructions
3. **Next Challenge**: Independent task to reinforce learning

### AI Integration
- **OpenAI**: Generates structured learning projects
- **Tavily**: Finds real, verified learning resources and content
- **Content-based**: Presents actual information instead of potentially broken links

## Deployment

### GitHub Actions
The project includes a GitHub Actions workflow for automated builds and deployments.

### Environment Variables for CI/CD
Add these secrets to your GitHub repository:
- `OPENAI_API_KEY`: Your OpenAI API key
- `TAVILY_API_KEY`: Your Tavily API key

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.