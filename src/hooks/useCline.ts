import { useState, useCallback } from 'react';
import { clineApi, ClineTask, ClineContext, ClineResponse } from '@/services/clineApi';

export interface UseClineState {
  currentTask: ClineTask | null;
  isLoading: boolean;
  error: string | null;
  tasks: ClineTask[];
  streamContent: string;
}

export function useCline() {
  const [state, setState] = useState<UseClineState>({
    currentTask: null,
    isLoading: false,
    error: null,
    tasks: [],
    streamContent: ''
  });

  const updateState = useCallback((updates: Partial<UseClineState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const createTask = useCallback(async (
    type: ClineTask['type'],
    instruction: string,
    context: ClineContext,
    options?: {
      code?: string;
      errorMessage?: string;
      language?: string;
    }
  ): Promise<ClineResponse> => {
    updateState({ isLoading: true, error: null, streamContent: '' });

    try {
      const response = await clineApi.createTask(type, instruction, context, options);
      
      updateState({
        currentTask: response.task,
        isLoading: false,
        tasks: clineApi.getAllTasks()
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('useCline createTask error:', error);
      updateState({ 
        isLoading: false, 
        error: errorMessage,
        tasks: clineApi.getAllTasks()
      });
      throw error;
    }
  }, [updateState]);

  const streamTask = useCallback(async function* (
    type: ClineTask['type'],
    instruction: string,
    context: ClineContext,
    options?: {
      code?: string;
      errorMessage?: string;
      language?: string;
    }
  ) {
    updateState({ isLoading: true, error: null, streamContent: '' });

    try {
      let accumulatedContent = '';

      for await (const chunk of clineApi.streamTask(type, instruction, context, options)) {
        if (chunk.content) {
          accumulatedContent += chunk.content;
          updateState({
            currentTask: chunk.task,
            streamContent: accumulatedContent,
            isLoading: !chunk.done
          });
        } else {
          updateState({
            currentTask: chunk.task,
            isLoading: !chunk.done
          });
        }

        if (chunk.done) {
          updateState({
            tasks: clineApi.getAllTasks()
          });
        }

        yield chunk;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateState({ 
        isLoading: false, 
        error: errorMessage,
        tasks: clineApi.getAllTasks()
      });
      throw error;
    }
  }, [updateState]);

  // Convenience methods
  const fixError = useCallback(async (errorMessage: string, code: string, context: ClineContext) => {
    return createTask('fix_error', `Fix this error: ${errorMessage}`, context, {
      code,
      errorMessage
    });
  }, [createTask]);

  const explainCode = useCallback(async (code: string, context: ClineContext) => {
    return createTask('explain_code', 'Explain how this code works', context, { code });
  }, [createTask]);

  const generateCode = useCallback(async (instruction: string, context: ClineContext) => {
    return createTask('generate_code', instruction, context);
  }, [createTask]);

  const refactorCode = useCallback(async (code: string, context: ClineContext) => {
    return createTask('refactor', 'Refactor this code to improve quality', context, { code });
  }, [createTask]);

  const optimizeCode = useCallback(async (code: string, context: ClineContext) => {
    return createTask('optimize', 'Optimize this code for better performance', context, { code });
  }, [createTask]);

  const generateTests = useCallback(async (code: string, context: ClineContext) => {
    return createTask('test', 'Generate comprehensive tests for this code', context, { code });
  }, [createTask]);

  const generateDocs = useCallback(async (code: string, context: ClineContext) => {
    return createTask('document', 'Generate documentation for this code', context, { code });
  }, [createTask]);

  const clearTasks = useCallback(() => {
    clineApi.clearTasks();
    updateState({
      tasks: [],
      currentTask: null,
      streamContent: '',
      error: null
    });
  }, [updateState]);

  const getTask = useCallback((taskId: string) => {
    return clineApi.getTask(taskId);
  }, []);

  const refreshTasks = useCallback(() => {
    updateState({ tasks: clineApi.getAllTasks() });
  }, [updateState]);

  return {
    // State
    ...state,
    
    // Actions
    createTask,
    streamTask,
    
    // Convenience methods
    fixError,
    explainCode,
    generateCode,
    refactorCode,
    optimizeCode,
    generateTests,
    generateDocs,
    
    // Utility methods
    clearTasks,
    getTask,
    refreshTasks
  };
}