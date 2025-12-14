/**
 * Kestra Integration Service
 * Manages Kestra workflow orchestration for automated DevOps processes
 */

export interface KestraExecution {
  id: string;
  namespace: string;
  flowId: string;
  state: {
    current: 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'KILLED';
    duration?: string;
  };
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  startDate: string;
  endDate?: string;
  taskRunList?: Array<{
    id: string;
    taskId: string;
    state: {
      current: string;
    };
    startDate: string;
    endDate?: string;
  }>;
}

export interface KestraFlow {
  id: string;
  namespace: string;
  description?: string;
  inputs?: Array<{
    id: string;
    type: string;
    description?: string;
  }>;
  tasks: Array<{
    id: string;
    type: string;
    description?: string;
  }>;
}

class KestraService {
  private static instance: KestraService;
  private baseUrl: string;
  private apiToken: string | null = null;
  private namespace: string;

  static getInstance(): KestraService {
    if (!KestraService.instance) {
      KestraService.instance = new KestraService();
    }
    return KestraService.instance;
  }

  constructor() {
    this.baseUrl = import.meta.env.VITE_KESTRA_URL || 'http://localhost:8080';
    this.apiToken = import.meta.env.VITE_KESTRA_API_TOKEN || null;
    this.namespace = import.meta.env.VITE_KESTRA_NAMESPACE || 'resurrectci';
  }

  /**
   * Configure Kestra connection
   */
  configure(url: string, apiToken?: string, namespace?: string) {
    this.baseUrl = url;
    if (apiToken) this.apiToken = apiToken;
    if (namespace) this.namespace = namespace;
    console.log('✅ Kestra configured:', { url: this.baseUrl, namespace: this.namespace });
  }

  /**
   * Check if Kestra is configured and accessible
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log('🔍 Checking Kestra connection...');
      
      const response = await fetch(`${this.baseUrl}/api/v1/flows/${this.namespace}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const isConnected = response.ok;
      console.log(`${isConnected ? '✅' : '❌'} Kestra connection: ${isConnected ? 'OK' : 'Failed'}`);
      
      return isConnected;
    } catch (error) {
      console.error('❌ Kestra connection failed:', error);
      return false;
    }
  }

  /**
   * Get request headers with authentication
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    return headers;
  }

  /**
   * Trigger ResurrectCI workflow
   */
  async triggerResurrectWorkflow(inputs: {
    deployment_id: string;
    project_name: string;
    branch: string;
    error_message: string;
    error_logs: string[];
  }): Promise<KestraExecution> {
    console.log('🚀 Triggering ResurrectCI workflow with inputs:', inputs);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${this.namespace}/resurrect-agent`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ inputs })
      });

      if (!response.ok) {
        throw new Error(`Kestra API error: ${response.status} ${response.statusText}`);
      }

      const execution = await response.json();
      console.log('✅ ResurrectCI workflow triggered:', execution.id);
      
      return execution;
    } catch (error) {
      console.error('❌ Failed to trigger ResurrectCI workflow:', error);
      
      // Return simulated execution for demo purposes
      const simulatedExecution: KestraExecution = {
        id: `exec_${Date.now()}`,
        namespace: this.namespace,
        flowId: 'resurrect-agent',
        state: {
          current: 'RUNNING'
        },
        inputs,
        startDate: new Date().toISOString()
      };
      
      console.log('⚠️ Using simulated execution:', simulatedExecution.id);
      return simulatedExecution;
    }
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<KestraExecution> {
    console.log(`📊 Getting execution status: ${executionId}`);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get execution: ${response.statusText}`);
      }

      const execution = await response.json();
      console.log(`✅ Execution ${executionId} status: ${execution.state.current}`);
      
      return execution;
    } catch (error) {
      console.error('❌ Failed to get execution:', error);
      throw error;
    }
  }

  /**
   * List recent executions
   */
  async listExecutions(limit: number = 10): Promise<KestraExecution[]> {
    console.log(`📋 Listing recent executions (limit: ${limit})`);

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/executions/search?namespace=${this.namespace}&size=${limit}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to list executions: ${response.statusText}`);
      }

      const data = await response.json();
      const executions = data.results || [];
      
      console.log(`✅ Found ${executions.length} executions`);
      return executions;
    } catch (error) {
      console.error('❌ Failed to list executions:', error);
      return [];
    }
  }

  /**
   * Get available flows
   */
  async listFlows(): Promise<KestraFlow[]> {
    console.log(`📋 Listing flows in namespace: ${this.namespace}`);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/flows/${this.namespace}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to list flows: ${response.statusText}`);
      }

      const flows = await response.json();
      console.log(`✅ Found ${flows.length} flows`);
      
      return flows;
    } catch (error) {
      console.error('❌ Failed to list flows:', error);
      return [];
    }
  }

  /**
   * Monitor execution until completion
   */
  async monitorExecution(executionId: string, onUpdate?: (execution: KestraExecution) => void): Promise<KestraExecution> {
    console.log(`👀 Monitoring execution: ${executionId}`);

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const execution = await this.getExecution(executionId);
          
          if (onUpdate) {
            onUpdate(execution);
          }

          if (execution.state.current === 'SUCCESS' || execution.state.current === 'FAILED') {
            console.log(`✅ Execution ${executionId} completed with status: ${execution.state.current}`);
            resolve(execution);
          } else {
            // Continue monitoring
            setTimeout(checkStatus, 5000); // Check every 5 seconds
          }
        } catch (error) {
          console.error('❌ Error monitoring execution:', error);
          reject(error);
        }
      };

      checkStatus();
    });
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    console.log(`🛑 Cancelling execution: ${executionId}`);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}/kill`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel execution: ${response.statusText}`);
      }

      console.log(`✅ Execution ${executionId} cancelled`);
    } catch (error) {
      console.error('❌ Failed to cancel execution:', error);
      throw error;
    }
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId: string): Promise<string[]> {
    console.log(`📄 Getting logs for execution: ${executionId}`);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}/logs`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get logs: ${response.statusText}`);
      }

      const logs = await response.json();
      console.log(`✅ Retrieved ${logs.length} log entries`);
      
      return logs.map((log: any) => log.message || log.toString());
    } catch (error) {
      console.error('❌ Failed to get execution logs:', error);
      return [];
    }
  }

  /**
   * Deploy a flow to Kestra
   */
  async deployFlow(flowContent: string): Promise<void> {
    console.log('🚀 Deploying flow to Kestra...');

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/flows`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/x-yaml'
        },
        body: flowContent
      });

      if (!response.ok) {
        throw new Error(`Failed to deploy flow: ${response.statusText}`);
      }

      console.log('✅ Flow deployed successfully');
    } catch (error) {
      console.error('❌ Failed to deploy flow:', error);
      throw error;
    }
  }
}

export const kestraService = KestraService.getInstance();
export default kestraService;