import { redirect } from 'next/navigation'

// Root redirects to streak demo — useful for testing without Braze
export default function Home() {
  redirect('/streak?family=demo&hardware=0,0,0,0,0,0,0&manual=0,0,0,0,0,0,0&startDate=2026-04-28')
}
