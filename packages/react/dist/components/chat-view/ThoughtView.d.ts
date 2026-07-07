import React from 'react';
import type { ContentBlock } from '@acp-components/core';
export interface ThoughtViewProps {
    thought: ContentBlock[];
    isStreaming: boolean;
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
}
export declare const ThoughtView: React.NamedExoticComponent<ThoughtViewProps>;
//# sourceMappingURL=ThoughtView.d.ts.map