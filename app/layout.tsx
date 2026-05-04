import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Morning Routine',
  description: 'Hatch morning routine streak tracker',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
