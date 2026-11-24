import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CocoXApp } from "@/components/cocox/CocoXApp";

// The launched tab must show the real CocoX address, not a blank page.
describe("Launch CocoX button", () => {
  it("opens a new tab at the CocoX address instead of about:blank", () => {
    const open = vi.fn((..._args: Parameters<typeof window.open>) => ({}) as Window);
    vi.spyOn(window, "open").mockImplementation(open);

    render(<CocoXApp />);
    fireEvent.click(screen.getByRole("button", { name: "Launch CocoX" }));

    expect(open).toHaveBeenCalledTimes(1);
    const call = open.mock.calls[0];
    if (!call) throw new Error("window.open was never called");
    const [url, target] = call;

    expect(target).toBe("_blank");
    expect(url).not.toBe("about:blank");
    const launchUrl = new URL(String(url), window.location.href);
    expect(launchUrl.pathname).toBe("/index.html");
    expect(launchUrl.search).toBe("");
  });
});
