import { useState, useEffect } from "react";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem("onboarding_completed");
    const isNewUser = localStorage.getItem("is_new_user");

    if (isNewUser && !completed) {
      setShowOnboarding(true);
    }

    if (completed) {
      setHasCompletedOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    localStorage.removeItem("is_new_user");
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("onboarding_completed");
    localStorage.setItem("is_new_user", "true");
    setShowOnboarding(true);
    setHasCompletedOnboarding(false);
  };

  return {
    showOnboarding,
    hasCompletedOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}
