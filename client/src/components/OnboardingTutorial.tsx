import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, Smartphone, Send, BarChart3, Shield } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    title: "Bem-vindo ao SentinelZap!",
    description:
      "Sistema inteligente de rodízio de chips para WhatsApp com Termostato que evita bloqueios automaticamente.",
    icon: <Shield className="h-12 w-12 text-primary" />,
  },
  {
    title: "Cadastre seus Chips",
    description:
      "Adicione quantos chips precisar. Cada chip terá limites diários e totais configuráveis para máxima segurança.",
    icon: <Smartphone className="h-12 w-12 text-primary" />,
  },
  {
    title: "Envie com Rodízio Inteligente",
    description:
      "O sistema seleciona automaticamente o chip com menor risco. Quando um chip atinge 80% de risco, ele é pausado automaticamente.",
    icon: <Send className="h-12 w-12 text-primary" />,
  },
  {
    title: "Monitore e Analise",
    description:
      "Acompanhe em tempo real o status de cada chip, visualize conversas no CRM e exporte relatórios detalhados em PDF/Excel.",
    icon: <BarChart3 className="h-12 w-12 text-primary" />,
  },
];

export default function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("sentinelzap_onboarding_complete");
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("sentinelzap_onboarding_complete", "true");
    setOpen(false);
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">{currentStepData.icon}</div>
          <DialogTitle className="text-center text-2xl">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep
                  ? "bg-primary"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto">
            Pular Tutorial
          </Button>
          <Button onClick={handleNext} className="w-full sm:w-auto">
            {currentStep < steps.length - 1 ? (
              <>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Começar
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
