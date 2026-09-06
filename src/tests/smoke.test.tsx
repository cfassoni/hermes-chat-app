import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "../App";

describe("Hermes Chat App Baseline Smoke Test", () => {
  it("renders the main application shell with title and navigation", () => {
    render(<App />);

    // Validate title and badge
    expect(screen.getByText("Hermes Chat")).toBeInTheDocument();
    expect(screen.getByText("Tauri v2")).toBeInTheDocument();

    // Validate active model badge
    expect(screen.getByText("hermes-3-llama-3.1-8b")).toBeInTheDocument();

    // Validate welcome message
    expect(
      screen.getByText(/Welcome to/i)
    ).toBeInTheDocument();

    // Validate input placeholder
    expect(
      screen.getByPlaceholderText(/Ask Hermes Agent or type a command.../i)
    ).toBeInTheDocument();
  });
});
