import * as vscode from "vscode";
import * as path from "path";
import { fetchComponentList } from "./registry";
import { installComponent } from "./install";
import { createShowcaseFile } from "./showcase";

async function hasShadcnConfig(workspaceRoot: string): Promise<boolean> {
  const configUri = vscode.Uri.file(path.join(workspaceRoot, "components.json"));
  try {
    await vscode.workspace.fs.stat(configUri);
    return true;
  } catch {
    return false;
  }
}

async function offerInit(workspaceRoot: string): Promise<boolean> {
  const choice = await vscode.window.showWarningMessage(
    "Não encontrei components.json neste projeto. O shadcn/ui precisa ser inicializado primeiro.",
    "Rodar npx shadcn init",
    "Cancelar"
  );

  if (choice !== "Rodar npx shadcn init") return false;

  const terminal = vscode.window.createTerminal({ name: "shadcn/ui Importer", hideFromUser: false });
  terminal.show(true);
  terminal.sendText(`npx shadcn@latest init --cwd "${workspaceRoot}"`);

  await vscode.window.showInformationMessage(
    "Termine o assistente de inicialização no terminal e rode o comando de novo depois."
  );
  return false;
}

async function maybeCreateShowcase(workspaceRoot: string, componentName: string): Promise<void> {
  const config = vscode.workspace.getConfiguration("shadcnImporter");
  const mode = config.get<string>("autoShowcase", "ask");

  if (mode === "never") return;

  let shouldCreate = mode === "always";
  if (mode === "ask") {
    const choice = await vscode.window.showInformationMessage(
      `Componente "${componentName}" instalado. Criar um arquivo de exemplo de uso?`,
      "Criar",
      "Não"
    );
    shouldCreate = choice === "Criar";
  }

  if (!shouldCreate) return;

  const showcaseDir = config.get<string>("showcasePath", "components/showcase");
  const fileUri = await createShowcaseFile(workspaceRoot, showcaseDir, componentName);
  const doc = await vscode.workspace.openTextDocument(fileUri);
  await vscode.window.showTextDocument(doc);
}

async function pickComponent(): Promise<string | undefined> {
  const quickPick = vscode.window.createQuickPick();
  quickPick.placeholder = "Buscando componentes do shadcn/ui...";
  quickPick.busy = true;
  quickPick.show();

  try {
    const components = await fetchComponentList();
    quickPick.items = components.map((c) => ({ label: c.name }));
    quickPick.placeholder = "Escolha um componente para importar";
    quickPick.busy = false;
  } catch (err) {
    quickPick.hide();
    vscode.window.showErrorMessage(
      `Não consegui buscar a lista de componentes do shadcn/ui: ${(err as Error).message}`
    );
    return undefined;
  }

  return new Promise((resolve) => {
    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0]?.label;
      quickPick.hide();
      resolve(selected);
    });
    quickPick.onDidHide(() => resolve(undefined));
  });
}

async function runAddComponent(componentName?: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("Abra uma pasta de projeto primeiro.");
    return;
  }
  const workspaceRoot = workspaceFolder.uri.fsPath;

  if (!(await hasShadcnConfig(workspaceRoot))) {
    await offerInit(workspaceRoot);
    return;
  }

  const name = componentName ?? (await pickComponent());
  if (!name) return;

  installComponent(name, workspaceRoot);
  await maybeCreateShowcase(workspaceRoot, name);
}

async function showQuickMenu(): Promise<void> {
  const choice = await vscode.window.showQuickPick(
    [
      { label: "$(list-selection) Add Component", description: "Escolher e instalar rapidamente" },
      { label: "$(browser) Open Component Browser", description: "Navegar com preview antes de instalar" },
    ],
    { placeHolder: "shadcn/ui" }
  );

  if (!choice) return;

  if (choice.label.includes("Add Component")) {
    await runAddComponent();
  } else {
    await vscode.commands.executeCommand("shadcnImporter.openPanel");
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(package) shadcn";
  statusBarItem.tooltip = "shadcn/ui Importer";
  statusBarItem.command = "shadcnImporter.quickMenu";
  statusBarItem.show();

  context.subscriptions.push(
    statusBarItem,
    vscode.commands.registerCommand("shadcnImporter.addComponent", () => runAddComponent()),
    vscode.commands.registerCommand("shadcnImporter.quickMenu", () => showQuickMenu()),
    vscode.commands.registerCommand("shadcnImporter.openPanel", async () => {
      const { openComponentBrowser } = await import("./panel");
      openComponentBrowser(context, (componentName) => runAddComponent(componentName));
    })
  );
}

export function deactivate(): void {}
