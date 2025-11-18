import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InterviewFiltersProps {
  statusFilter: string;
  typeFilter: string;
  onStatusChange: (status: string) => void;
  onTypeChange: (type: string) => void;
}

const InterviewFilters = ({ 
  statusFilter, 
  typeFilter, 
  onStatusChange, 
  onTypeChange 
}: InterviewFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Tabs value={statusFilter} onValueChange={onStatusChange} className="w-full sm:w-auto">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Interview Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="technical">Technical</SelectItem>
          <SelectItem value="behavioral">Behavioral</SelectItem>
          <SelectItem value="system_design">System Design</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default InterviewFilters;
