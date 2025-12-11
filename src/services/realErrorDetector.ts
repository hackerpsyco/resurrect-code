export interface RealError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export class RealErrorDetector {
  private static instance: RealErrorDetector;

  static getInstance(): RealErrorDetector {
    if (!RealErrorDetector.instance) {
      RealErrorDetector.instance = new RealErrorDetector();
    }
    return RealErrorDetector.instance;
  }

  // Analyze actual file content for real errors
  analyzeFileContent(filePath: string, content: string): RealError[] {
    const errors: RealError[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for actual syntax issues
      if (this.hasSyntaxError(line)) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: 1,
          message: this.getSyntaxErrorMessage(line),
          severity: 'error'
        });
      }

      // Check for common issues
      if (line.includes('console.log') && !line.includes('// keep')) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: line.indexOf('console.log') + 1,
          message: 'Console.log statement should be removed',
          severity: 'warning'
        });
      }

      // Check for var usage
      if (line.match(/\bvar\s+/) && !line.includes('// legacy')) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: line.indexOf('var') + 1,
          message: 'Use "let" or "const" instead of "var"',
          severity: 'warning'
        });
      }

      // Check for missing semicolons (simple check)
      if (this.missingSemicolon(line)) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'error'
        });
      }

      // Check for TypeScript any usage
      if (line.includes(': any') && !line.includes('// @ts-ignore')) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: line.indexOf(': any') + 1,
          message: 'Avoid using "any" type',
          severity: 'warning'
        });
      }
    });

    return errors;
  }

  private hasSyntaxError(line: string): boolean {
    // Basic syntax error detection
    const trimmed = line.trim();
    
    // Unmatched brackets
    const openBrackets = (trimmed.match(/\{/g) || []).length;
    const closeBrackets = (trimmed.match(/\}/g) || []).length;
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    
    if (openBrackets !== closeBrackets || openParens !== closeParens) {
      return true;
    }

    // Unclosed strings (basic check)
    const singleQuotes = (trimmed.match(/'/g) || []).length;
    const doubleQuotes = (trimmed.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      return true;
    }

    return false;
  }

  private getSyntaxErrorMessage(line: string): string {
    if (line.includes('{') && !line.includes('}')) {
      return 'Unclosed curly brace';
    }
    if (line.includes('(') && !line.includes(')')) {
      return 'Unclosed parenthesis';
    }
    if ((line.match(/'/g) || []).length % 2 !== 0) {
      return 'Unclosed single quote';
    }
    if ((line.match(/"/g) || []).length % 2 !== 0) {
      return 'Unclosed double quote';
    }
    return 'Syntax error detected';
  }

  private missingSemicolon(line: string): boolean {
    const trimmed = line.trim();
    
    // Skip empty lines, comments, and lines that don't need semicolons
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || 
        trimmed.startsWith('*') || trimmed.endsWith('{') || trimmed.endsWith('}') ||
        trimmed.startsWith('if') || trimmed.startsWith('for') || trimmed.startsWith('while') ||
        trimmed.startsWith('function') || trimmed.startsWith('class') || trimmed.startsWith('interface') ||
        trimmed.startsWith('type') || trimmed.startsWith('import') || trimmed.startsWith('export')) {
      return false;
    }

    // Check if line should end with semicolon but doesn't
    if (trimmed.match(/^(const|let|var|return)\s+/) && !trimmed.endsWith(';') && !trimmed.endsWith(',')) {
      return true;
    }

    // Function calls and assignments
    if ((trimmed.includes('=') || trimmed.includes('(')) && 
        !trimmed.endsWith(';') && !trimmed.endsWith(',') && !trimmed.endsWith('{')) {
      return true;
    }

    return false;
  }

  // Get errors for current file content
  getCurrentFileErrors(filePath: string, content: string): RealError[] {
    if (!filePath || !content) {
      return [];
    }

    return this.analyzeFileContent(filePath, content);
  }
}

export const realErrorDetector = RealErrorDetector.getInstance();