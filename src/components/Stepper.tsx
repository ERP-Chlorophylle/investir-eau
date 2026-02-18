import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep: number;
  steps: { label: string }[];
  currentStepFillPercent?: number;
}

export function Stepper({ currentStep, steps, currentStepFillPercent = 70 }: StepperProps) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const fillPercent = isCompleted ? 100 : isCurrent ? currentStepFillPercent : 0;
        const numberClass =
          isCompleted || fillPercent >= 55 ? "text-primary-foreground" : isCurrent ? "text-primary" : "text-muted-foreground";

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  isCurrent ? "border-primary shadow-glow" : "border-muted"
                )}
                style={{
                  background: `conic-gradient(hsl(var(--primary)) ${fillPercent}%, #ffffff ${fillPercent}% 100%)`,
                }}
              >
                <span className={cn(numberClass)}>
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                </span>
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium hidden sm:block",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "stepper-line w-8 sm:w-16",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
