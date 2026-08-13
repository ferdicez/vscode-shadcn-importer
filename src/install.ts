import * as vscode from "vscode";

const TERMINAL_NAME = "shadcn/ui Importer";

function getTerminal(): vscode.Terminal {
  const existing = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);
  if (existing) return existing;
  return vscode.window.createTerminal({ name: TERMINAL_NAME, hideFromUser: false });
}

export function installComponent(componentName: string, cwd: string): void {
  const terminal = getTerminal();
  terminal.show(true);
  terminal.sendText(`npx shadcn@latest add ${componentName} --cwd "${cwd}"`);
}
