import { DatabaseUnavailableScreen } from '@/components/database-unavailable-screen';
import { Component, type ErrorInfo, type ReactNode } from 'react';

type DatabaseErrorBoundaryProps = {
  children: ReactNode;
};

type DatabaseErrorBoundaryState = {
  error: Error | null;
};

const OPFS_LOCK_ERROR = /createSyncAccessHandle|NoModificationAllowedError|already open/i;

export class DatabaseErrorBoundary extends Component<
  DatabaseErrorBoundaryProps,
  DatabaseErrorBoundaryState
> {
  state: DatabaseErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): DatabaseErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[kharcha] database error boundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      const isOtherTab = OPFS_LOCK_ERROR.test(this.state.error.message ?? '');
      return (
        <DatabaseUnavailableScreen
          kind={isOtherTab ? 'other-tab' : 'error'}
          onRetry={() => {
            if (typeof window !== 'undefined' && typeof window.location.reload === 'function') {
              window.location.reload();
            }
          }}
        />
      );
    }
    return this.props.children;
  }
}
