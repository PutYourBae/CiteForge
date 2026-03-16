import React from 'react'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { PaperDetailPage } from './pages/PaperDetailPage'
import { SavedPapersPage } from './pages/SavedPapersPage'
import { ResearchGraphPage } from './pages/ResearchGraphPage'
import { SettingsPage } from './pages/SettingsPage'
import { useUIStore } from './store/ui.store'

export default function App() {
  const currentPage = useUIStore(s => s.currentPage)
  const selectedPaperId = useUIStore(s => s.selectedPaperId)

  const renderPage = () => {
    switch (currentPage) {
      case 'home':     return <HomePage />
      case 'results':  return selectedPaperId ? <PaperDetailPage /> : <ResultsPage />
      case 'saved':    return <SavedPapersPage />
      case 'graph':    return <ResearchGraphPage />
      case 'settings': return <SettingsPage />
      default:         return <HomePage />
    }
  }

  return <AppShell>{renderPage()}</AppShell>
}
