/// <reference types="react" />
/// <reference types="next" />

import type { ReactNode } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {}; 