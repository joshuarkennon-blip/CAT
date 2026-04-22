// scripts/router.js

import { getToolById, getToolByKeywords } from './tools-registry.js';

/**
 * Route a user request to a tool.
 * @param {string} text — Raw user input from composer
 * @param {string|null} selectedToolId — Explicit tool selection from dropdown (or null)
 * @returns {{ tool, confidence: 'explicit'|'matched'|'none' }}
 */
export function route(text, selectedToolId = null) {
  if (selectedToolId) {
    const tool = getToolById(selectedToolId);
    return { tool, confidence: 'explicit' };
  }

  const tool = getToolByKeywords(text);
  if (tool) return { tool, confidence: 'matched' };

  return { tool: null, confidence: 'none' };
}
