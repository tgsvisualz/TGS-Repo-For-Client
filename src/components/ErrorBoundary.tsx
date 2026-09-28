import { Component, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  /** Rendered instead of the children once they throw (e.g. the hero's still stage). */
  fallback: ReactNode
  onError?: (error: unknown) => void
  children?: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

/** Contains a failing subtree (the 3D showroom, above all) so the rest of the page lives on. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
