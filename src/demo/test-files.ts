// Demo files for testing extension functionality

export const demoFiles = {
  'demo.py': `# Python Demo File - Test Python Extension Features
import os
import sys
from typing import List, Dict

def hello_world():
    print("Hello, World!")

class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, a: int, b: int) -> int:
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def get_history(self) -> List[str]:
        return self.history

if __name__ == "__main__":
    calc = Calculator()
    result = calc.add(5, 3)
    print(f"Result: {result}")
`,

  'demo.ts': `// TypeScript Demo File - Test Copilot and TypeScript Features
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

class UserService {
  private users: User[] = [];

  async fetchUsers(): Promise<User[]> {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const data = await response.json();
      this.users = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  findUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  getActiveUsers(): User[] {
    return this.users.filter(user => user.isActive);
  }
}

// Test async function - Copilot should suggest error handling
async function processUsers() {
  const userService = new UserService();
  // Type here to test Copilot suggestions
}

export { UserService, User };
`,

  'demo.js': `// JavaScript Demo File - Test JavaScript Features
function createApiClient(baseUrl) {
  return {
    async get(endpoint) {
      const response = await fetch(\`\${baseUrl}\${endpoint}\`);
      return response.json();
    },
    
    async post(endpoint, data) {
      const response = await fetch(\`\${baseUrl}\${endpoint}\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    }
  };
}

// Test object destructuring and arrow functions
const users = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Jane', age: 25 },
  { id: 3, name: 'Bob', age: 35 }
];

const getAdultUsers = (users) => users.filter(user => user.age >= 18);
const getUserNames = (users) => users.map(({ name }) => name);

console.log('Adult users:', getAdultUsers(users));
console.log('User names:', getUserNames(users));
`,

  'demo.json': `{
  "name": "demo-project",
  "version": "1.0.0",
  "description": "Demo project for testing extensions",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "webpack": "^5.88.0"
  },
  "keywords": ["demo", "extensions", "vscode"],
  "author": "Demo Author",
  "license": "MIT"
}`,

  'styles.css': `/* CSS Demo File - Test CSS Features */
:root {
  --primary-color: #007acc;
  --secondary-color: #f0f0f0;
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  line-height: 1.6;
  color: #333;
  background-color: var(--secondary-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #005a9e;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .container {
    padding: 0 10px;
  }
  
  .btn {
    display: block;
    text-align: center;
    margin: 10px 0;
  }
}`
};

export const getDemoFile = (filename: string): string => {
  return demoFiles[filename as keyof typeof demoFiles] || '';
};