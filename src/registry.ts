const REGISTRY_INDEX_URL = "https://ui.shadcn.com/r/index.json";
const REGISTRY_STYLE = "new-york-v4";

export interface RegistryComponent {
  name: string;
  type: string;
}

export interface RegistryComponentDetail {
  name: string;
  dependencies: string[];
  files: { path: string; content: string }[];
}

interface RawRegistryItem {
  name: string;
  type: string;
}

let cache: RegistryComponent[] | undefined;
const detailCache = new Map<string, RegistryComponentDetail>();

export async function fetchComponentList(): Promise<RegistryComponent[]> {
  if (cache) return cache;

  const res = await fetch(REGISTRY_INDEX_URL);
  if (!res.ok) {
    throw new Error(`Falha ao buscar o registro do shadcn (${res.status})`);
  }

  const items = (await res.json()) as RawRegistryItem[];
  cache = items
    .filter((item) => item.type === "registry:ui")
    .map((item) => ({ name: item.name, type: item.type }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return cache;
}

export async function fetchComponentDetail(name: string): Promise<RegistryComponentDetail> {
  const cached = detailCache.get(name);
  if (cached) return cached;

  const res = await fetch(`https://ui.shadcn.com/r/styles/${REGISTRY_STYLE}/${name}.json`);
  if (!res.ok) {
    throw new Error(`Falha ao buscar o preview de "${name}" (${res.status})`);
  }

  const raw = (await res.json()) as {
    dependencies?: string[];
    files?: { path: string; content: string }[];
  };

  const detail: RegistryComponentDetail = {
    name,
    dependencies: raw.dependencies ?? [],
    files: raw.files ?? [],
  };

  detailCache.set(name, detail);
  return detail;
}
