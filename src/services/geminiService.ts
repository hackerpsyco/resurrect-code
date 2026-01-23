/**
 * Gemini Service - AI-powered code analysis
 * Handles communication with Google's Gemini API for code analysis
 */

import { geminiKeyService } from './geminiKeyService';

export interface CodeFile {
  name: string;
  content: string;
  language?: string;
}

export interface Suggestion {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  issue: string;
  suggestion: string;
  codeSection: string;
}

export interface AnalysisResult {
  file: string;
  suggestions: Suggestion[];
}

export interface AnalysisResponse {
  projectName: string;
  timestamp: number;
  totalIssues: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  files: AnalysisResult[];
}

class GeminiService {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';

  /**
   * Analyze code files using Gemini API
   */
  async analyzeCode(files: CodeFile[], projectName: string): Promise<AnalysisResponse> {
    const apiKey = geminiKeyService.getKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please connect in Settings.');
    }

    // Prepare code for analysis
    const codeContent = files
      .map(f => `File: ${f.name}\n\`\`\`${f.language || 'text'}\n${f.content}\n\`\`\``)
      .join('\n\n');

    const prompt = `You are an expert code reviewer. Analyze the following code and provide improvement suggestions.

For each issue found, provide:
1. Priority level (Critical, High, Medium, Low)
2. Issue description
3. Specific suggestion for improvement
4. The exact code section that needs improvement

Format your response as JSON with this structure:
{
  "files": [
    {
      "file": "filename",
      "suggestions": [
        {
          "priority": "High",
          "issue": "Issue description",
          "suggestion": "How to fix it",
          "codeSection": "The problematic code"
        }
      ]
    }
  ]
}

Code to analyze:
${codeContent}`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Extract text from response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON response
      let analysisData;
      try {
        // Extract JSON from response (it might be wrapped in markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Could not parse JSON from response');
        }
        analysisData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Failed to parse analysis results');
      }

      // Process and format results
      return this.formatAnalysisResults(analysisData, projectName);
    } catch (error) {
      console.error('❌ Gemini analysis error:', error);
      throw error;
    }
  }

  /**
   * Format analysis results
   */
  private formatAnalysisResults(data: any, projectName: string): AnalysisResponse {
    const files: AnalysisResult[] = [];
    let totalIssues = 0;
    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };

    if (data.files && Array.isArray(data.files)) {
      for (const file of data.files) {
        const suggestions: Suggestion[] = [];
        
        if (file.suggestions && Array.isArray(file.suggestions)) {
          for (const suggestion of file.suggestions) {
            const priority = (suggestion.priority || 'Medium').toLowerCase();
            if (priority in byPriority) {
              byPriority[priority as keyof typeof byPriority]++;
            }
            totalIssues++;

            suggestions.push({
              priority: suggestion.priority || 'Medium',
              issue: suggestion.issue || 'Issue found',
              suggestion: suggestion.suggestion || 'Review and improve',
              codeSection: suggestion.codeSection || ''
            });
          }
        }

        if (suggestions.length > 0) {
          files.push({
            file: file.file || 'unknown',
            suggestions
          });
        }
      }
    }

    return {
      projectName,
      timestamp: Date.now(),
      totalIssues,
      byPriority: {
        critical: byPriority.critical,
        high: byPriority.high,
        medium: byPriority.medium,
        low: byPriority.low
      },
      files
    };
  }

  /**
   * Generate improved code based on suggestions
   */
  async generateImprovement(file: CodeFile, suggestion: Suggestion): Promise<string> {
    const apiKey = geminiKeyService.getKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `You are an expert code refactorer. Based on this suggestion, provide the improved code.

Original code:
\`\`\`
${suggestion.codeSection}
\`\`\`

Issue: ${suggestion.issue}
Suggestion: ${suggestion.suggestion}

Provide ONLY the improved code without any explanation or markdown formatting.`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate improvement: ${response.status}`);
      }

      const data = await response.json();
      const improvedCode = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!improvedCode) {
        throw new Error('No improvement generated');
      }

      return improvedCode.trim();
    } catch (error) {
      console.error('❌ Improvement generation error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
