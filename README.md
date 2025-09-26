# LearnCanvas

A modern, hands-on learning platform that creates personalized projects for beginners using AI.

## Features

- **Canvas-style Interface**: Clean, distraction-free learning environment
- **AI-Powered Project Generation**: Creates step-by-step projects using OpenAI
- **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key

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

1. **User Input**: Students answer "What do you want to learn?"
2. **AI Processing**: The input is sent to OpenAI with a system prompt for project creation
3. **Project Generation**: AI creates a step-by-step project with free resources
4. **Canvas Display**: The project is displayed directly on the canvas interface

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI Integration**: OpenAI GPT-4
- **Deployment**: Vercel (recommended)

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for project generation

## Contributing

This is a prototype for an educational learning platform. The interface is designed to be clean, modern, and focused on hands-on learning through AI-generated projects.