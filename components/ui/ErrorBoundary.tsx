'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  label?: string
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-err/15 text-err flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </div>
        <div className="text-[15px] font-semibold mb-1">
          {this.props.label ?? 'Что-то пошло не так'}
        </div>
        <div className="text-[13px] text-mute mb-5 max-w-sm">
          {this.state.error.message || 'Произошла непредвиденная ошибка'}
        </div>
        <button
          onClick={() => this.setState({ error: null })}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-line text-[13px] font-medium text-mute hover:text-slate-800 hover:border-line2 transition-all"
        >
          <RefreshCw size={13} /> Попробовать снова
        </button>
      </div>
    )
  }
}
