import * as vscode from "vscode";
import { fetchComponentList, fetchComponentDetail } from "./registry";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildListHtml(componentNames: string[]): string {
  const items = componentNames
    .map((name) => `<li class="item" data-name="${escapeHtml(name)}">${escapeHtml(name)}</li>`)
    .join("\n");

  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    padding: 0;
    margin: 0;
  }
  #search {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border: none;
    border-bottom: 1px solid var(--vscode-widget-border, #444);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    outline: none;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .item {
    padding: 6px 12px;
    cursor: pointer;
  }
  .item:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .item.hidden {
    display: none;
  }
</style>
</head>
<body>
  <input id="search" type="text" placeholder="Buscar componente..." />
  <ul id="list">
    ${items}
  </ul>
  <script>
    const vscode = acquireVsCodeApi();
    const search = document.getElementById("search");
    const list = document.getElementById("list");

    list.addEventListener("click", (event) => {
      const target = event.target;
      if (target && target.classList.contains("item")) {
        vscode.postMessage({ type: "preview", name: target.dataset.name });
      }
    });

    search.addEventListener("input", () => {
      const query = search.value.toLowerCase();
      for (const item of list.children) {
        item.classList.toggle("hidden", !item.dataset.name.includes(query));
      }
    });
  </script>
</body>
</html>`;
}

function buildDetailHtml(
  name: string,
  dependencies: string[],
  files: { path: string; content: string }[]
): string {
  const depsLine =
    dependencies.length > 0
      ? `<p class="deps">Dependências: ${dependencies.map(escapeHtml).join(", ")}</p>`
      : "";

  const filesHtml = files
    .map(
      (file) => `
    <p class="filepath">${escapeHtml(file.path)}</p>
    <pre><code>${escapeHtml(file.content)}</code></pre>`
    )
    .join("\n");

  const docsUrl = `https://ui.shadcn.com/docs/components/${encodeURIComponent(name)}`;

  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    padding: 0;
    margin: 0;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--vscode-widget-border, #444);
    position: sticky;
    top: 0;
    background: var(--vscode-editor-background);
  }
  .toolbar h2 {
    margin: 0;
    font-size: 14px;
    flex: 1;
  }
  button, .link-button {
    font-family: inherit;
    font-size: 13px;
    padding: 4px 12px;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }
  #back {
    background: transparent;
    color: var(--vscode-foreground);
  }
  .link-button {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }
  .link-button:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
  #install {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  #install:hover {
    background: var(--vscode-button-hoverBackground);
  }
  .content {
    padding: 12px;
  }
  .deps {
    opacity: 0.8;
    font-size: 12px;
  }
  .filepath {
    font-size: 12px;
    opacity: 0.7;
    margin: 16px 0 4px;
  }
  pre {
    background: var(--vscode-textCodeBlock-background, #1e1e1e);
    padding: 10px;
    overflow-x: auto;
    border-radius: 4px;
    font-size: 12px;
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button id="back">&larr; Voltar</button>
    <h2>${escapeHtml(name)}</h2>
    <a class="link-button" id="viewSite" href="#">Visualizar no site &#8599;</a>
    <button id="install">Sim, instalar</button>
  </div>
  <div class="content">
    ${depsLine}
    ${filesHtml}
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById("back").addEventListener("click", () => {
      vscode.postMessage({ type: "back" });
    });
    document.getElementById("viewSite").addEventListener("click", (event) => {
      event.preventDefault();
      vscode.postMessage({ type: "openDocs", url: ${JSON.stringify(docsUrl)} });
    });
    document.getElementById("install").addEventListener("click", () => {
      vscode.postMessage({ type: "install", name: ${JSON.stringify(name)} });
    });
  </script>
</body>
</html>`;
}

export async function openComponentBrowser(
  context: vscode.ExtensionContext,
  onInstall: (componentName: string) => void
): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "shadcnComponentBrowser",
    "shadcn/ui Components",
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  panel.webview.html = `<!doctype html><body style="font-family: var(--vscode-font-family); padding: 16px;">Carregando componentes...</body>`;

  let componentNames: string[];
  try {
    const components = await fetchComponentList();
    componentNames = components.map((c) => c.name);
    panel.webview.html = buildListHtml(componentNames);
  } catch (err) {
    panel.webview.html = `<!doctype html><body style="font-family: var(--vscode-font-family); padding: 16px;">Erro ao buscar componentes: ${escapeHtml(
      (err as Error).message
    )}</body>`;
    return;
  }

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message?.type === "preview" && typeof message.name === "string") {
      const name = message.name;
      panel.webview.html = `<!doctype html><body style="font-family: var(--vscode-font-family); padding: 16px;">Carregando preview de "${escapeHtml(
        name
      )}"...</body>`;
      try {
        const detail = await fetchComponentDetail(name);
        panel.webview.html = buildDetailHtml(name, detail.dependencies, detail.files);
      } catch (err) {
        panel.webview.html = `<!doctype html><body style="font-family: var(--vscode-font-family); padding: 16px;">Erro ao buscar preview: ${escapeHtml(
          (err as Error).message
        )}</body>`;
      }
      return;
    }

    if (message?.type === "back") {
      panel.webview.html = buildListHtml(componentNames);
      return;
    }

    if (message?.type === "openDocs" && typeof message.url === "string") {
      vscode.env.openExternal(vscode.Uri.parse(message.url));
      return;
    }

    if (message?.type === "install" && typeof message.name === "string") {
      onInstall(message.name);
    }
  });

  context.subscriptions.push(panel);
}
