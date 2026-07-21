'use client';

/**
 * PostHog client provider for Next.js App Router.
 * Default Host: https://analytics-madez-u70402.vm.elestio.app/ph
 * Default Token: phc_AqkgSdvobEj73uNgSPBN63sHyffc3hkABnAf2dJPjGyj
 */
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useRef } from 'react';

const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || 'phc_AqkgSdvobEj73uNgSPBN63sHyffc3hkABnAf2dJPjGyj';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://analytics-madez-u70402.vm.elestio.app/ph';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    posthog.init(POSTHOG_TOKEN, {
      api_host: POSTHOG_HOST,
      defaults: '2026-05-30',
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
