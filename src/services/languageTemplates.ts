// Language templates for quick file creation
export interface LanguageTemplate {
  name: string;
  language: string;
  extension: string;
  template: string;
  description: string;
}

export const languageTemplates: LanguageTemplate[] = [
  {
    name: "JavaScript Function",
    language: "javascript",
    extension: ".js",
    description: "Basic JavaScript function template",
    template: `// JavaScript Function Template
function myFunction(param1, param2) {
  // Your code here
  return param1 + param2;
}

// Example usage
const result = myFunction(5, 3);
console.log(result); // Output: 8
`
  },
  {
    name: "TypeScript Interface",
    language: "typescript",
    extension: ".ts",
    description: "TypeScript interface and class template",
    template: `// TypeScript Interface Template
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
}

// Example usage
const userService = new UserService();
const newUser: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  isActive: true
};

userService.addUser(newUser);
`
  },
  {
    name: "Python Class",
    language: "python",
    extension: ".py",
    description: "Python class template with methods",
    template: `# Python Class Template
class Calculator:
    """A simple calculator class."""
    
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        """Add two numbers."""
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def subtract(self, a, b):
        """Subtract two numbers."""
        result = a - b
        self.history.append(f"{a} - {b} = {result}")
        return result
    
    def get_history(self):
        """Get calculation history."""
        return self.history

# Example usage
if __name__ == "__main__":
    calc = Calculator()
    print(calc.add(10, 5))      # Output: 15
    print(calc.subtract(10, 3)) # Output: 7
    print(calc.get_history())   # Output: ['10 + 5 = 15', '10 - 3 = 7']
`
  },
  {
    name: "C++ Class",
    language: "cpp",
    extension: ".cpp",
    description: "C++ class template with header",
    template: `// C++ Class Template
#include <iostream>
#include <string>
#include <vector>

class Student {
private:
    std::string name;
    int age;
    std::vector<double> grades;

public:
    // Constructor
    Student(const std::string& name, int age) : name(name), age(age) {}
    
    // Getter methods
    std::string getName() const { return name; }
    int getAge() const { return age; }
    
    // Add grade
    void addGrade(double grade) {
        grades.push_back(grade);
    }
    
    // Calculate average grade
    double getAverageGrade() const {
        if (grades.empty()) return 0.0;
        
        double sum = 0.0;
        for (double grade : grades) {
            sum += grade;
        }
        return sum / grades.size();
    }
    
    // Display student info
    void displayInfo() const {
        std::cout << "Name: " << name << ", Age: " << age 
                  << ", Average Grade: " << getAverageGrade() << std::endl;
    }
};

int main() {
    Student student("Alice", 20);
    student.addGrade(85.5);
    student.addGrade(92.0);
    student.addGrade(78.5);
    
    student.displayInfo();
    
    return 0;
}
`
  },
  {
    name: "React Component",
    language: "typescript",
    extension: ".tsx",
    description: "React functional component with TypeScript",
    template: `import React, { useState, useEffect } from 'react';

interface Props {
  title: string;
  initialCount?: number;
}

const Counter: React.FC<Props> = ({ title, initialCount = 0 }) => {
  const [count, setCount] = useState<number>(initialCount);
  const [isEven, setIsEven] = useState<boolean>(initialCount % 2 === 0);

  useEffect(() => {
    setIsEven(count % 2 === 0);
  }, [count]);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialCount);

  return (
    <div className="counter">
      <h2>{title}</h2>
      <div className="count-display">
        <span className={isEven ? 'even' : 'odd'}>
          Count: {count}
        </span>
      </div>
      <div className="controls">
        <button onClick={decrement}>-</button>
        <button onClick={reset}>Reset</button>
        <button onClick={increment}>+</button>
      </div>
      <p>The number is {isEven ? 'even' : 'odd'}</p>
    </div>
  );
};

export default Counter;
`
  },
  {
    name: "HTML5 Template",
    language: "html",
    extension: ".html",
    description: "Complete HTML5 document template",
    template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Your page description">
    <title>Your Page Title</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .btn {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin: 5px;
        }
        .btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Welcome to My Website</h1>
        </header>
        
        <main>
            <section>
                <h2>About</h2>
                <p>This is a sample HTML5 template with modern structure and styling.</p>
            </section>
            
            <section>
                <h2>Features</h2>
                <ul>
                    <li>Responsive design</li>
                    <li>Clean HTML5 structure</li>
                    <li>Modern CSS styling</li>
                    <li>Interactive JavaScript</li>
                </ul>
            </section>
            
            <section>
                <h2>Actions</h2>
                <a href="#" class="btn" onclick="showAlert()">Click Me</a>
                <a href="#" class="btn" onclick="changeColor()">Change Color</a>
            </section>
        </main>
        
        <footer>
            <p>&copy; 2024 Your Website. All rights reserved.</p>
        </footer>
    </div>

    <script>
        function showAlert() {
            alert('Hello from JavaScript!');
        }
        
        function changeColor() {
            const container = document.querySelector('.container');
            const colors = ['#fff', '#f0f8ff', '#f5f5dc', '#ffe4e1', '#f0fff0'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            container.style.backgroundColor = randomColor;
        }
        
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Page loaded successfully!');
        });
    </script>
</body>
</html>
`
  },
  {
    name: "CSS Grid Layout",
    language: "css",
    extension: ".css",
    description: "Modern CSS Grid layout template",
    template: `/* CSS Grid Layout Template */

/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

/* Grid Container */
.grid-container {
    display: grid;
    grid-template-columns: 1fr 3fr 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: 
        "header header header"
        "sidebar main aside"
        "footer footer footer";
    min-height: 100vh;
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

/* Grid Items */
.header {
    grid-area: header;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    text-align: center;
    border-radius: 10px;
}

.sidebar {
    grid-area: sidebar;
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 10px;
    border-left: 4px solid #007bff;
}

.main {
    grid-area: main;
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.aside {
    grid-area: aside;
    background: #e9ecef;
    padding: 1.5rem;
    border-radius: 10px;
}

.footer {
    grid-area: footer;
    background: #343a40;
    color: white;
    padding: 1.5rem;
    text-align: center;
    border-radius: 10px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .grid-container {
        grid-template-columns: 1fr;
        grid-template-areas: 
            "header"
            "main"
            "sidebar"
            "aside"
            "footer";
        gap: 15px;
        padding: 15px;
    }
}

/* Utility Classes */
.card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
}

.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    transition: background 0.3s ease;
}

.btn:hover {
    background: #0056b3;
}

/* Animation */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in {
    animation: fadeIn 0.6s ease-out;
}
`
  }
];

export const getTemplateByLanguage = (language: string): LanguageTemplate[] => {
  return languageTemplates.filter(template => template.language === language);
};

export const getTemplateByName = (name: string): LanguageTemplate | undefined => {
  return languageTemplates.find(template => template.name === name);
};

export const getAllTemplates = (): LanguageTemplate[] => {
  return languageTemplates;
};