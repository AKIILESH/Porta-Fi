// context/FinanceContext.jsx - Simplified version
import { createContext, useContext } from 'react'

const FinanceContext = createContext(null)

export function FinanceProvider({ children, userId }) {
  return (
    <FinanceContext.Provider value={{ userId }}>
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider')
  return ctx
}