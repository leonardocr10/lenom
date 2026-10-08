import { content, syncWhatsappUrl } from '../data/content';

/**
 * Carrega o conteúdo publicado da API antes do app renderizar.
 * Se a API estiver fora, o site segue com os valores padrão de `content.ts`.
 */
export async function loadContent(): Promise<void> {
  try {
    const response = await fetch('/api/content', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;

    const data = (await response.json()) as Partial<typeof content>;
    for (const [key, value] of Object.entries(data)) {
      const isEmptyList = Array.isArray(value) && value.length === 0;
      if (value === null || value === undefined || isEmptyList) continue;
      (content as unknown as Record<string, unknown>)[key] = value;
    }
  } catch {
    console.warn('[content] API indisponível — usando o conteúdo padrão.');
  } finally {
    syncWhatsappUrl();
  }
}
