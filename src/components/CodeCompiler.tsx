
import { useState, useEffect } from "react";
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

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" }
  ];

  const runCode = () => {
    setIsRunning(true);
    setLastCodeRun(code);
    
    // Clear previous output to show real-time updates
    setOutput("// Running code...\n");
    
    // This is a mock implementation that simulates real-time output updates
    const outputSteps = [
      "// Compiling...\n",
      "// Setting up execution environment...\n",
      "// Executing code...\n"
    ];
    
    let stepIndex = 0;
    
    // Simulate real-time output with intervals
    const outputInterval = setInterval(() => {
      if (stepIndex < outputSteps.length) {
        setOutput(prev => prev + outputSteps[stepIndex]);
        stepIndex++;
      } else {
        clearInterval(outputInterval);
        
        // Final output after "real-time" updates
        let result;
        if (selectedLanguage === "javascript") {
          try {
            // In a real implementation, we would use a safer evaluation method
            // For demo purposes, we'll simulate a JavaScript evaluation
            result = "// Output:\n";
            
            // Only try to evaluate if it's JavaScript
            if (code.includes("console.log")) {
              // Extract what's being logged and add it to output
              const logMatch = code.match(/console\.log\(['"](.+)['"]\)/);
              if (logMatch && logMatch[1]) {
                result += `${logMatch[1]}\n`;
              } else {
                result += "undefined\n";
              }
            } else {
              result += "// No console.log statements found\n";
            }
          } catch (error) {
            result = `Error: ${error}\n`;
          }
        } else {
          result = `// Output for ${selectedLanguage}:\n`;
          result += `// Server-side execution would show real output here\n`;
          
          // Add some language-specific simulated output
          if (selectedLanguage === "python") {
            result += ">>> Code executed successfully\n";
          } else if (selectedLanguage === "java" || selectedLanguage === "cpp") {
            result += "Compilation successful\nExecution completed\n";
          }
        }
        
        setOutput(prev => prev + result);
        setIsRunning(false);
      }
    }, 500); // Update every 500ms for demo purposes
    
    // Clean up interval if component unmounts
    return () => clearInterval(outputInterval);
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    if (onLanguageChange) {
      onLanguageChange(value);
    }
    // Update placeholder when language changes
    setCode(`// Write your ${value} code here`);
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
          <pre className="bg-gray-800 text-gray-200 p-4 rounded-md whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[200px]">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CodeCompiler;
