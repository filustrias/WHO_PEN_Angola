import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const paginas = defineCollection({
  loader: glob({ pattern: '*.md', base: './conteudo' }),
  schema: z.object({
    titulo: z.string(),
    subtitulo: z.string().optional(),
    resumo: z.string(),
    secao: z.string(),
    ordem: z.number(),
    rota: z.string(),
    id: z.string().optional(),
    origem: z.string().optional(),
    // true: a página não é gerada nem aparece no menu (o ficheiro fica guardado)
    oculto: z.boolean().optional(),
  }),
});

export const collections = { paginas };
