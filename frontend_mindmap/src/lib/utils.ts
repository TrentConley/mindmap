import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getNodeStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#10b981'; // green
    case 'in_progress':
      return '#f59e0b'; // amber
    case 'locked':
      return '#ef4444'; // red
    default:
      return '#94a3b8'; // slate-400
  }
}

export function isLatexString(str: string): boolean {
  return /\$\$.*\$\$|\$.*\$/.test(str);
}

export function formatLatexContent(content: string): string {
  // Replace LaTeX equation delimiters for rendering
  return content
    .replace(/\$\$(.*?)\$\$/g, '<span class="latex-block">$1</span>')
    .replace(/\$(.*?)\$/g, '<span class="latex-inline">$1</span>');
}