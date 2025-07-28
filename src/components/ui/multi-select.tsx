import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}

export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ options, value, onChange, onBlur, placeholder, className }, ref) => {
    const [inputValue, setInputValue] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)

    const filteredOptions = options.filter(option => 
      !value.includes(option) && 
      option.toLowerCase().includes(inputValue.toLowerCase())
    )

    const handleAddValue = (option: string) => {
      if (!value.includes(option)) {
        const newValue = [...value, option];
        onChange(newValue);
      }
      setInputValue("")
      setIsOpen(false)
    }

    const handleRemoveValue = (option: string) => {
      onChange(value.filter(v => v !== option))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault()
        handleAddValue(inputValue.trim())
      } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
        handleRemoveValue(value[value.length - 1])
      }
    }

    const handleInputBlur = (e: React.FocusEvent) => {
      // Use a longer timeout to ensure state updates complete first
      setTimeout(() => {
        setIsOpen(false);
        onBlur?.();
      }, 300);
    };

    return (
      <div ref={ref} className={cn("relative", className)}>
        <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px] bg-background">
          {value.map((item) => (
            <Badge key={item} variant="secondary" className="flex items-center gap-1">
              {item}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => handleRemoveValue(item)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            onBlur={handleInputBlur}
            placeholder={value.length === 0 ? placeholder : ""}
            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 flex-1 min-w-[100px]"
          />
        </div>
        {isOpen && (filteredOptions.length > 0 || inputValue.trim()) && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <button
                key={option}
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={() => handleAddValue(option)}
              >
                {option}
              </button>
            ))}
            {inputValue.trim() && !options.includes(inputValue.trim()) && (
              <button
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm font-medium"
                onClick={() => handleAddValue(inputValue.trim())}
              >
                Add "{inputValue.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"