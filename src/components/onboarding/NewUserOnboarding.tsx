import { OnboardingGuide } from "./OnboardingGuide";

interface NewUserOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function NewUserOnboarding({ onComplete, onSkip }: NewUserOnboardingProps) {
  return (
    <OnboardingGuide
      onClose={onSkip}
      onComplete={onComplete}
    />
  );
}
