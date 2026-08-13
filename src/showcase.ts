import * as vscode from "vscode";
import * as path from "path";

function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function buildShowcaseContent(componentName: string): string {
  const pascalName = toPascalCase(componentName);

  return `import { ${pascalName} } from "@/components/ui/${componentName}"

export default function ${pascalName}Showcase() {
  return (
    <div className="p-8">
      <${pascalName} />
    </div>
  )
}
`;
}

export async function createShowcaseFile(
  workspaceRoot: string,
  showcaseDir: string,
  componentName: string
): Promise<vscode.Uri> {
  const targetDir = path.isAbsolute(showcaseDir)
    ? showcaseDir
    : path.join(workspaceRoot, showcaseDir);

  const fileUri = vscode.Uri.file(path.join(targetDir, `${componentName}.tsx`));

  await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDir));
  await vscode.workspace.fs.writeFile(
    fileUri,
    Buffer.from(buildShowcaseContent(componentName), "utf8")
  );

  return fileUri;
}
