"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[atlas:error-boundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "ui-monospace, monospace",
            color: "#3D3229",
            background: "#F5F0E8",
            minHeight: "100vh",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Liebeskarte crashed</h1>
          <pre style={{ whiteSpace: "pre-wrap", color: "#C4704B" }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
