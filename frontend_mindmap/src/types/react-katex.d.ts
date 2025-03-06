declare module 'react-katex' {
  import { ReactNode } from 'react';
  
  interface KatexProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
    settings?: object;
    [key: string]: any;
  }
  
  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
}