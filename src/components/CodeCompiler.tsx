
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" }
  ];

  const runCode = () => {
    setIsRunning(true);
    
    // This is a mock implementation - in a real implementation,
    // we would send the code to a backend service for execution
    setTimeout(() => {
      let result;
      if (selectedLanguage === "javascript") {
        try {
          // Use a safer way to evaluate JavaScript in production
          result = "// Output would appear here in a real implementation\n";
          result += "// For security reasons, we don't actually run the code in the browser";
        } catch (error) {
          result = `Error: ${error}`;
        }
      } else {
        result = `// Output would appear here in a real implementation\n`;
        result += `// Server-side execution for ${selectedLanguage} would be implemented in a production environment`;
      }
      
      setOutput(result);
      setIsRunning(false);
    }, 1000);
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    if (onLanguageChange) {
      onLanguageChange(value);
    }
  };

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
          {isRunning ? "Running..." : "Run Code"}
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
