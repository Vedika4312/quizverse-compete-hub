
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CodeCompilerProps {
  language: string;
  defaultLanguage?: string;
  onLanguageChange?: (language: string) => void;
  readOnly?: boolean;
}

const CodeCompiler = ({ 
  language = "javascript", 
  defaultLanguage,
  onLanguageChange,
  readOnly = false 
}: CodeCompilerProps) => {
  const [code, setCode] = useState<string>(`// Write your ${language} code here`);
  const [output, setOutput] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage || language);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCodeRun, setLastCodeRun] = useState<string>("");
  const outputRef = useRef<HTMLPreElement>(null);

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "ruby", label: "Ruby" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" }
  ];

  // Scroll output to bottom when new content is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const runCode = () => {
    setIsRunning(true);
    setLastCodeRun(code);
    
    // Clear previous output
    setOutput("");
    
    // This is a mock implementation that simulates real-time output updates
    const outputSteps = [
      "// Initializing compiler...\n",
      `// Setting up ${selectedLanguage} environment...\n`,
      "// Parsing code...\n",
      "// Executing...\n"
    ];
    
    // Simulate real-time output with more realistic timing
    let stepIndex = 0;
    
    const appendOutput = (text: string) => {
      setOutput(prev => prev + text);
    };
    
    // Start real-time output simulation
    appendOutput(outputSteps[stepIndex++]);
    
    const outputInterval = setInterval(() => {
      if (stepIndex < outputSteps.length) {
        appendOutput(outputSteps[stepIndex++]);
      } else {
        clearInterval(outputInterval);
        executeCode();
      }
    }, 300);
  };

  const executeCode = () => {
    // Language-specific execution logic
    let result = "";
    
    try {
      switch (selectedLanguage) {
        case "javascript":
          // Create a safer JavaScript evaluation method
          result = evaluateJavaScript(code);
          break;
        case "python":
          result = simulatePythonExecution(code);
          break;
        case "java":
          result = simulateJavaExecution(code);
          break;
        case "cpp":
          result = simulateCppExecution(code);
          break;
        case "csharp":
          result = simulateCSharpExecution(code);
          break;
        case "ruby":
          result = simulateRubyExecution(code);
          break;
        case "go":
          result = simulateGoExecution(code);
          break;
        case "rust":
          result = simulateRustExecution(code);
          break;
        default:
          result = `// ${selectedLanguage} execution not implemented\n`;
      }
    } catch (error) {
      result = `// Error: ${error}\n`;
    } finally {
      setOutput(prev => prev + "\n// Output:\n" + result);
      setIsRunning(false);
    }
  };

  const evaluateJavaScript = (jsCode: string) => {
    // Mock console.log to capture output
    let output = "";
    const originalConsoleLog = console.log;
    
    try {
      // Override console.log to capture output
      console.log = (...args) => {
        output += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n';
        originalConsoleLog(...args);
      };
      
      // Execute code in a controlled environment
      // This is simplified and not secure for production
      if (jsCode.includes('console.log')) {
        // eslint-disable-next-line no-new-func
        new Function(jsCode)();
      } else {
        output = "// No console.log statements found. Add some to see output.\n";
      }
      
      return output || "// Code executed but produced no output\n";
    } catch (error) {
      return `// Runtime error: ${error.message}\n`;
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog;
    }
  };

  // Simulation functions for other languages
  const simulatePythonExecution = (code: string) => {
    if (code.includes('print(')) {
      // Extract print statements and show them
      const printRegex = /print\(['"](.*?)['"]\)/g;
      const matches = [...code.matchAll(printRegex)];
      
      if (matches.length > 0) {
        return matches.map(m => m[1]).join('\n') + '\n';
      }
    }
    return ">>> Program executed successfully\n";
  };

  const simulateJavaExecution = (code: string) => {
    if (code.includes('System.out.println')) {
      const printRegex = /System\.out\.println\(['"](.*?)['"]\)/g;
      const matches = [...code.matchAll(printRegex)];
      
      if (matches.length > 0) {
        return matches.map(m => m[1]).join('\n') + '\n';
      }
    }
    return "Compilation successful\nProgram executed\n";
  };

  const simulateCppExecution = (code: string) => {
    if (code.includes('cout <<')) {
      const printRegex = /cout << ['"](.*?)['"]/g;
      const matches = [...code.matchAll(printRegex)];
      
      if (matches.length > 0) {
        return matches.map(m => m[1]).join('\n') + '\n';
      }
    }
    return "Compilation successful\nProgram executed\n";
  };

  const simulateCSharpExecution = (code: string) => {
    if (code.includes('Console.WriteLine')) {
      const printRegex = /Console\.WriteLine\(['"](.*?)['"]\)/g;
      const matches = [...code.matchAll(printRegex)];
      
      if (matches.length > 0) {
        return matches.map(m => m[1]).join('\n') + '\n';
      }
    }
    return "Build: Successful\nProgram output follows\n";
  };

  const simulateRubyExecution = (code: string) => {
    if (code.includes('puts')) {
      const printRegex = /puts ['"](.*?)['"]/g;
      const matches = [...code.matchAll(printRegex)];
      
      if (matches.length > 0) {
        return matches.map(m => m[1]).join('\n') + '\n';
      }
    }
    return "=> nil\n";
  };

  const simulateGoExecution = (code: string) => {
    if (code.includes('fmt.Println')) {
      const printRegex = /fmt\.Println\(['"](.*?)['"]\)/g;
      const matches = [...code.matchAll(printRegex)];
      
      if (matches.length > 0) {
        return matches.map(m => m[1]).join('\n') + '\n';
      }
    }
    return "go: building application\nProgram exited\n";
  };

  const simulateRustExecution = (code: string) => {
    if (code.includes('println!')) {
      const printRegex = /println!\(['"](.*?)['"]\)/g;
      const matches = [...code.matchAll(printRegex)];
      
      if (matches.length > 0) {
        return matches.map(m => m[1]).join('\n') + '\n';
      }
    }
    return "Compiling...\nFinished dev [unoptimized + debuginfo]\n";
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    if (onLanguageChange) {
      onLanguageChange(value);
    }
    
    // Update sample code based on language
    switch (value) {
      case "javascript":
        setCode(`// JavaScript Example
console.log("Hello, World!");
const sum = (a, b) => a + b;
console.log("2 + 3 =", sum(2, 3));`);
        break;
      case "python":
        setCode(`# Python Example
print("Hello, World!")
def sum(a, b):
    return a + b
print(f"2 + 3 = {sum(2, 3)}")`);
        break;
      case "java":
        setCode(`// Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("2 + 3 = " + sum(2, 3));
    }
    
    static int sum(int a, int b) {
        return a + b;
    }
}`);
        break;
      case "cpp":
        setCode(`// C++ Example
#include <iostream>
using namespace std;

int sum(int a, int b) {
    return a + b;
}

int main() {
    cout << "Hello, World!";
    cout << "2 + 3 = " << sum(2, 3);
    return 0;
}`);
        break;
      case "csharp":
        setCode(`// C# Example
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        Console.WriteLine($"2 + 3 = {Sum(2, 3)}");
    }
    
    static int Sum(int a, int b) {
        return a + b;
    }
}`);
        break;
      case "ruby":
        setCode(`# Ruby Example
puts "Hello, World!"
def sum(a, b)
  a + b
end
puts "2 + 3 = #{sum(2, 3)}"`);
        break;
      case "go":
        setCode(`// Go Example
package main

import "fmt"

func sum(a, b int) int {
    return a + b
}

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("2 + 3 =", sum(2, 3))
}`);
        break;
      case "rust":
        setCode(`// Rust Example
fn sum(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    println!("Hello, World!");
    println!("2 + 3 = {}", sum(2, 3));
}`);
        break;
      default:
        setCode(`// Write your ${value} code here`);
    }
  };

  // Reset output when code changes substantially (if it's not the code that was just run)
  useEffect(() => {
    if (code !== lastCodeRun && output) {
      setOutput("");
    }
  }, [code, lastCodeRun]);

  return (
    <div className="border rounded-md p-4 bg-gray-50 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Code Compiler</h3>
        
        {!readOnly && (
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="font-mono text-sm min-h-[200px] bg-gray-900 text-gray-100 p-4"
        placeholder={`Write your ${selectedLanguage} code here...`}
        readOnly={readOnly}
      />
      
      {!readOnly && (
        <Button 
          onClick={runCode} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : "Run Code"}
        </Button>
      )}
      
      {output && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Output:</h4>
          <pre 
            ref={outputRef}
            className="bg-gray-800 text-gray-200 p-4 rounded-md whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[200px]"
          >
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CodeCompiler;
