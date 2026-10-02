/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../core/auth/AuthProvider';
import AccessDeniedCard from './AccessDeniedCard';
import { TabId } from '../permissions';

interface ProtectedRouteProps {
  tabId: TabId;
  children: React.ReactNode;
  onGoHome?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  tabId,
  children,
  onGoHome,
}) => {
  const { hasTabAccess, effectiveRole } = useAuth();

  const isAllowed = hasTabAccess(tabId);

  if (!isAllowed) {
    return (
      <AccessDeniedCard
        currentRole={effectiveRole}
        tabId={tabId}
        onGoHome={onGoHome || (() => { window.location.hash = '#home'; })}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
