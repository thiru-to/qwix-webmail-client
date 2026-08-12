import { Component, type ReactNode } from 'react'
import { Button } from './ui/button'

type Props = {
  children: ReactNode
  resetKey?: string
}

type State = {
  error: Error | null
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="query-error workspace-boundary-error" role="alert">
          <p>{this.state.error.message || 'This workspace crashed.'}</p>
          <Button type="button" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
