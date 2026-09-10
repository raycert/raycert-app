export interface TrainerNavItem {
  label: string;
  href: string;
}

export const trainerNavItems: TrainerNavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Quizzes", href: "/quizzes" },
  { label: "Assessments", href: "/assessments" },
  { label: "Results", href: "/results" },
];
