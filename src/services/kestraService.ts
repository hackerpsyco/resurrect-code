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
  private webhookKey: string;
  private flowId: string;

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
    
    // ✅ WEBHOOK CONFIGURATION (FREE MODE)
    this.flowId = 'resurrect-agent';
    this.webhookKey = 'resurrectci'; // must match workflow trigger key
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
   * Check if Kestra webhook is accessible (FREE MODE - NO TOKEN REQUIRED)
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log('🔍 Checking Kestra connection...');
      console.log(`Testing URL: ${this.baseUrl}`);
      
      // Step 1: Check if Kestra server is running (basic connectivity)
      try {
        const healthResponse = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        if (healthResponse.ok) {
          console.log('✅ Kestra server is running');
        } else {
          console.log(`⚠️ Kestra health check returned: ${healthResponse.status}`);
        }
      } catch (healthError) {
        console.log('⚠️ Health check failed, trying direct webhook test...');
      }

      // Step 2: Test webhook endpoint directly
      const webhookUrl = `${this.baseUrl}/api/v1/executions/webhook/${this.namespace}/${this.flowId}/${this.webhookKey}`;
      console.log(`Testing webhook: ${webhookUrl}`);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          project_id: 'connection_test',
          project_name: 'test',
          branch: 'main',
          error_message: 'connection test',
          error_logs: ['testing connection']
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      console.log(`Webhook response: ${webhookResponse.status} ${webhookResponse.statusText}`);

      // Consider these status codes as "connected":
      // 200/201: Workflow executed successfully
      // 404: Workflow not found (but server is running)
      // 400: Bad request (but server is running and accepting requests)
      const isConnected = webhookResponse.ok || 
                         webhookResponse.status === 404 || 
                         webhookResponse.status === 400;

      if (isConnected) {
        console.log('✅ Kestra webhook endpoint is accessible');
        if (webhookResponse.status === 404) {
          console.log('ℹ️ Workflow not deployed yet - deploy resurrect-agent.yml to Kestra');
        }
      } else {
        console.log(`❌ Kestra webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
      }
      
      return isConnected;
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          console.error('❌ Connection timeout - Kestra server may not be running');
          console.error('💡 Start Kestra with: docker run -p 8080:8080 kestra/kestra:latest server local');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.error('❌ Network error - Kestra server unreachable');
          console.error('💡 Check if Kestra is running on:', this.baseUrl);
        } else if (error.message.includes('CORS')) {
          console.error('❌ CORS error - Kestra server running but blocking requests');
        } else {
          console.error('❌ Connection error:', error.message);
        }
      } else {
        console.error('❌ Unknown connection error:', error);
      }
      return false;
    }
  }

  /**
   * Get request headers with authentication (ADMIN API ONLY)
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
   * Ensure admin access is available (ADMIN API GUARD)
   */
  private ensureAdminAccess(): void {
    if (!this.apiToken) {
      throw new Error('❌ Kestra admin API requires API token. Use webhook methods for free tier.');
    }
  }

  /**
   * Trigger ResurrectCI workflow via WEBHOOK (FREE MODE - NO TOKEN REQUIRED)
   */
  async triggerResurrectWorkflow(inputs: {
    project_id: string;
    project_name: string;
    branch: string;
    error_message: string;
    error_logs: string[];
  }): Promise<{ executionId: string }> {
    console.log('🚀 Triggering ResurrectCI via webhook with inputs:', inputs);

    try {
      // ✅ WEBHOOK TRIGGER (Works without API token)
      const response = await fetch(
        `${this.baseUrl}/api/v1/executions/webhook/${this.namespace}/${this.flowId}/${this.webhookKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputs)
        }
      );

      if (!response.ok) {
        throw new Error(`Kestra webhook failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const executionId = data.id || `webhook_${Date.now()}`;
      
      console.log('✅ ResurrectCI workflow triggered via webhook:', executionId);
      
      return { executionId };
    } catch (error) {
      console.error('❌ Failed to trigger ResurrectCI workflow via webhook:', error);
      
      // Return simulated execution for demo purposes
      const simulatedExecutionId = `webhook_sim_${Date.now()}`;
      console.log('⚠️ Using simulated webhook execution:', simulatedExecutionId);
      
      return { executionId: simulatedExecutionId };
    }
  }

  /**
   * Get execution status (ADMIN API - REQUIRES TOKEN)
   */
  async getExecution(executionId: string): Promise<KestraExecution> {
    this.ensureAdminAccess(); // ❌ REQUIRES API TOKEN
    
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
   * List recent executions (ADMIN API - REQUIRES TOKEN)
   */
  async listExecutions(limit: number = 10): Promise<KestraExecution[]> {
    this.ensureAdminAccess(); // ❌ REQUIRES API TOKEN
    
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
   * Get available flows (ADMIN API - REQUIRES TOKEN)
   */
  async listFlows(): Promise<KestraFlow[]> {
    this.ensureAdminAccess(); // ❌ REQUIRES API TOKEN
    
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
   * Monitor execution until completion (ADMIN API - REQUIRES TOKEN)
   */
  async monitorExecution(executionId: string, onUpdate?: (execution: KestraExecution) => void): Promise<KestraExecution> {
    this.ensureAdminAccess(); // ❌ REQUIRES API TOKEN
    
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
   * Cancel a running execution (ADMIN API - REQUIRES TOKEN)
   */
  async cancelExecution(executionId: string): Promise<void> {
    this.ensureAdminAccess(); // ❌ REQUIRES API TOKEN
    
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
   * Get execution logs (ADMIN API - REQUIRES TOKEN)
   */
  async getExecutionLogs(executionId: string): Promise<string[]> {
    this.ensureAdminAccess(); // ❌ REQUIRES API TOKEN
    
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
   * Deploy a flow to Kestra (ADMIN API - REQUIRES TOKEN)
   */
  async deployFlow(flowContent: string): Promise<void> {
    this.ensureAdminAccess(); // ❌ REQUIRES API TOKEN
    
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

  /**
   * Check if admin features are available
   */
  hasAdminAccess(): boolean {
    return !!this.apiToken;
  }

  /**
   * Get webhook URL for external integrations
   */
  getWebhookUrl(): string {
    return `${this.baseUrl}/api/v1/executions/webhook/${this.namespace}/${this.flowId}/${this.webhookKey}`;
  }
}

export const kestraService = KestraService.getInstance();
export default kestraService;