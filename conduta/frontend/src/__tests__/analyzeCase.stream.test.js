import { describe, it, expect, vi, afterEach } from 'vitest';
import { analyzeCase } from '../services/api';

function mockStream(parts) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      parts.forEach((p) => controller.enqueue(enc.encode(p)));
      controller.close();
    },
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
}

afterEach(() => vi.unstubAllGlobals());

describe('analyzeCase — stream SSE', () => {
  it('remonta evento partido entre chunks e ignora heartbeat', async () => {
    mockStream(['data: {"session_msg_count":0}\n\n: ping\n\ndata: {"cont', 'ent":"olá"}\n\ndata: [DONE]\n\n']);
    const onChunk = vi.fn();
    await analyzeCase('s1', 'caso', onChunk, vi.fn());
    expect(onChunk).toHaveBeenCalledWith('olá');
  });

  it('lança erro quando o backend emite evento error', async () => {
    mockStream(['data: {"error":"Falhou"}\n\ndata: [DONE]\n\n']);
    await expect(analyzeCase('s1', 'caso', vi.fn(), vi.fn())).rejects.toThrow('Falhou');
  });

  it('lança erro quando o stream termina sem [DONE]', async () => {
    mockStream(['data: {"content":"parcial"}\n\n']);
    await expect(analyzeCase('s1', 'caso', vi.fn(), vi.fn())).rejects.toThrow(/interrompida/);
  });
});
