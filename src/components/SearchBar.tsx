import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export const SearchBar = ({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
}: SearchBarProps) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="w-full bg-background pl-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
