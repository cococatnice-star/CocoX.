import { createFileRoute } from "@tanstack/react-router";
import { CocoXApp } from "@/components/cocox/CocoXApp";

// Explicit entry route so direct visits to /index.html are handled by TanStack Start.
export const Route = createFileRoute("/index.html")({
  component: CocoXApp,
});
