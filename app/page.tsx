'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'

export default function Home() {
  const { user } = useAuth()
  const [userInput, setUserInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showProject, setShowProject] = useState(false)
  const [projectContent, setProjectContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the hidden input on mount
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput.trim()) {
      handleBegin()
    }
  }

  const handleBegin = async () => {
    if (!userInput.trim()) return

    setIsLoading(true)
    setShowProject(true)
    
    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: userInput }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate project')
      }

      const data = await response.json()
      setProjectContent(data.project)
    } catch (error) {
      console.error('Error generating project:', error)
      setProjectContent('Sorry, there was an error generating your project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProject = async () => {
    if (!user) {
      setSaveMessage('Please sign in to save projects')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/save-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: userInput,
          content: projectContent,
          topic: userInput,
          userId: user.uid
        }),
      })

      if (response.ok) {
        setSaveMessage('Project saved successfully!')
      } else {
        setSaveMessage('Failed to save project')
      }
    } catch (error) {
      setSaveMessage('Failed to save project')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="canvas">
        <div className="content max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!showProject ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h1 className="text-6xl font-light text-gray-800 mb-12 leading-tight">
                What do you want to learn?
              </h1>
              
              <div className="flex flex-col items-center space-y-8">
                <div className="relative">
                  <div className="text-4xl text-gray-600 mb-4 min-h-[3rem] flex items-center">
                    {userInput || <span className="typing-cursor">|</span>}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                    placeholder="Type your learning goal here..."
                    autoFocus
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBegin}
                  disabled={!userInput.trim()}
                  className="px-8 py-4 bg-gray-800 text-white text-lg font-medium hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Begin
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="project"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-800"
            >
              <h1 className="text-4xl font-light mb-8 text-left">
                {userInput}
              </h1>
              
              <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                    <span className="ml-3 text-lg text-gray-600">Generating your project...</span>
                  </div>
                ) : (
                  <>
                    <div className="prose max-w-none">
                      <div 
                        className="text-lg leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ 
                          __html: projectContent
                            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-semibold mb-4 text-gray-800">$1</h1>')
                            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3 text-gray-700">$1</h2>')
                            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-2 text-gray-600">$1</h3>')
                            .replace(/^\* (.*$)/gim, '<li class="mb-1">$1</li>')
                            .replace(/^(\d+)\. (.*$)/gim, '<li class="mb-2"><strong>$1.</strong> $2</li>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
                            .replace(/\n/g, '<br />')
                        }}
                      />
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-4">
                          <button
                            onClick={handleSaveProject}
                            disabled={isSaving || !user}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Save Project'}
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowProject(false)
                              setProjectContent('')
                              setUserInput('')
                              setSaveMessage('')
                            }}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Create New Project
                          </button>
                        </div>
                        
                        {saveMessage && (
                          <div className={`text-sm ${saveMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                            {saveMessage}
                          </div>
                        )}
                      </div>
                      
                      {!user && (
                        <div className="mt-4 text-sm text-gray-600">
                          Sign in to save your projects and access them across devices.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
