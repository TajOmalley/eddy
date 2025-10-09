import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'LearnCanvas - What do you want to learn?',
  description: 'Learn through hands-on projects with AI guidance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
