import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  tourKey: string; // Unique key for localStorage
}

export const OnboardingTour = ({ steps, onComplete, tourKey }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Check if user has completed this tour before
    const hasCompletedTour = localStorage.getItem(`tour-completed-${tourKey}`);
    if (!hasCompletedTour) {
      setIsActive(true);
    }
  }, [tourKey]);

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const targetElement = document.querySelector(steps[currentStep].target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const placement = steps[currentStep].placement || "bottom";

      let top = 0;
      let left = 0;

      switch (placement) {
        case "bottom":
          top = rect.bottom + window.scrollY + 10;
          left = rect.left + window.scrollX + rect.width / 2;
          break;
        case "top":
          top = rect.top + window.scrollY - 10;
          left = rect.left + window.scrollX + rect.width / 2;
          break;
        case "left":
          top = rect.top + window.scrollY + rect.height / 2;
          left = rect.left + window.scrollX - 10;
          break;
        case "right":
          top = rect.top + window.scrollY + rect.height / 2;
          left = rect.right + window.scrollX + 10;
          break;
      }

      setPosition({ top, left });

      // Highlight the target element
      targetElement.classList.add("onboarding-highlight");
      
      // Scroll element into view
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return () => {
      const targetElement = document.querySelector(steps[currentStep].target);
      if (targetElement) {
        targetElement.classList.remove("onboarding-highlight");
      }
    };
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tour-completed-${tourKey}`, "true");
    setIsActive(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isActive || !steps[currentStep]) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100] pointer-events-none" />

      {/* Tour Card */}
      <Card
        className="fixed z-[101] w-80 shadow-2xl border-2 border-primary animate-scale-in"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: "translateX(-50%)",
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>

          <div className="mt-3 text-center">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Helper hook to trigger tour
export const useOnboardingTour = (tourKey: string) => {
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(`tour-completed-${tourKey}`);
    if (!hasCompletedTour) {
      // Delay showing tour slightly to let page load
      const timer = setTimeout(() => {
        setShouldShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tourKey]);

  const resetTour = () => {
    localStorage.removeItem(`tour-completed-${tourKey}`);
    setShouldShowTour(true);
  };

  return { shouldShowTour, resetTour };
};
