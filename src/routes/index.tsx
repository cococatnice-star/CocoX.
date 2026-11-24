import { createFileRoute } from "@tanstack/react-router";
import { CocoXApp } from "@/components/cocox/CocoXApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CocoX.wtf — Home" },
      { name: "description", content: "CocoX.wtf — your browser home." },
      { property: "og:title", content: "CocoX.wtf — Home" },
      { property: "og:description", content: "CocoX.wtf — your browser home." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CocoXApp,
});
