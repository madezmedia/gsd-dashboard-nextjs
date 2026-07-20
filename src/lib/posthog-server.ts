/** Server-side PostHog — npm i posthog-node (optional) */
import { PostHog } from 'posthog-node';

export function createPostHogServer(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token || !host) return null;
  return new PostHog(token, { host, flushAt: 1, flushInterval: 0 });
}
