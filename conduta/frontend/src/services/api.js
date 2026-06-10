const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('conduta_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function checkUnauthorized(res) {
  if (res.status === 401) {
    let message = 'Sessão expirada. Faça login novamente.';
    try {
      const data = await res.clone().json();
      if (data.code === 'SESSION_KICKED') message = data.error;
    } catch {}
    window.dispatchEvent(new CustomEvent('conduta:unauthorized', { detail: { message } }));
    throw new Error(message);
  }
  if (res.status === 403) {
    let data = {};
    try { data = await res.clone().json(); } catch {}
    if (data.code === 'EMAIL_NOT_VERIFIED') {
      window.dispatchEvent(new CustomEvent('conduta:email-not-verified'));
      const err = new Error(data.error || 'Email não verificado.');
      err.code = 'EMAIL_NOT_VERIFIED';
      throw err;
    }
  }
  return res;
}

export async function register(nome, email, senha, termsAcceptedAt) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha, terms_accepted_at: termsAcceptedAt }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao criar conta.');
  }
  return res.json();
}

export async function login(email, senha) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Credenciais inválidas.');
    err.code = data.code;
    throw err;
  }
  return res.json();
}

export async function getSessions() {
  const res = await fetch(`${BASE_URL}/sessions`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar sessões.');
  return res.json();
}

export async function createSession(titulo) {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ titulo }),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao criar sessão.');
  return res.json();
}

export async function getSession(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar sessão.');
  return res.json();
}

export async function deleteSession(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao deletar sessão.');
  // 204 No Content — sem corpo para parsear
}

export async function submitFeedback(messageId, feedback, note) {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message_id: messageId, feedback, note: note || undefined }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Erro ao enviar feedback.');
  }
  return res.json();
}

/**
 * Envia caso para análise com streaming SSE.
 * Chama onChunk(string) a cada fragmento recebido.
 * Chama onSessionMsgCount(number) quando recebe session_msg_count.
 */
export async function analyzeCase(sessionId, content, onChunk, onSessionMsgCount, mode = 'completa') {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ session_id: sessionId, content, mode }),
  });

  await checkUnauthorized(res);
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Limite de análises atingido.');
    err.code = 'USAGE_LIMIT';
    err.usage = { used: data.used, limit: data.limit, plan: data.plan };
    throw err;
  }
  if (!res.ok) throw new Error('Erro ao processar análise.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.session_msg_count !== undefined) {
          onSessionMsgCount?.(parsed.session_msg_count);
        } else if (parsed.content) {
          onChunk(parsed.content);
        }
      } catch {
        // ignora linha malformada
      }
    }
  }
}

export async function getUsage() {
  const res = await fetch(`${BASE_URL}/usage`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar uso.');
  return res.json();
}

export async function markCoachmarks(type) {
  const res = await fetch(`${BASE_URL}/auth/me/coachmarks`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ type }),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao marcar coachmark.');
  return res.json();
}

// ── Admin Knowledge ────────────────────────────────────────────
// Rotas admin exigem JWT com role = 'admin' (Bearer token normal).

export async function getPendingKnowledge() {
  const res = await fetch(`${BASE_URL}/admin/knowledge/pending`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar pendentes.');
  return res.json();
}

export async function approveKnowledge(elementId) {
  const res = await fetch(`${BASE_URL}/admin/knowledge/${elementId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ approvedBy: 'admin' }),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao aprovar.');
  return res.json();
}

export async function rejectKnowledge(elementId) {
  const res = await fetch(`${BASE_URL}/admin/knowledge/${elementId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao rejeitar.');
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${BASE_URL}/admin/knowledge/documents`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao listar documentos.');
  return res.json();
}

export async function uploadDocument(file, fonte) {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('fonte', fonte);
  const res = await fetch(`${BASE_URL}/admin/knowledge/documents`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao importar PDF.');
  }
  return res.json();
}

// ─────── ADMIN FEEDBACKS ──────────────
export async function getAdminFeedbacks() {
  const res = await fetch(`${BASE_URL}/admin/feedbacks`, {
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar correções.');
  return res.json();
}

export async function deactivateAdminFeedback(nodeId) {
  const res = await fetch(`${BASE_URL}/admin/feedbacks/${encodeURIComponent(nodeId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao desativar correção.');
  return res.json();
}

export async function validateAdminFeedback(nodeId) {
  const res = await fetch(`${BASE_URL}/admin/feedbacks/${encodeURIComponent(nodeId)}/validate`, {
    method: 'PUT',
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao validar correção.');
  return res.json();
}

export async function rejectAdminFeedback(nodeId) {
  const res = await fetch(`${BASE_URL}/admin/feedbacks/${encodeURIComponent(nodeId)}/reject`, {
    method: 'PUT',
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao rejeitar correção.');
  return res.json();
}

export async function getFeedbackStats() {
  const res = await fetch(`${BASE_URL}/feedback/stats`, {
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar estatísticas.');
  return res.json();
}

// ─────── ADMIN USERS ──────────────
export async function getAdminUsers(search) {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${BASE_URL}/admin/users${params}`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao listar usuários.');
  return res.json();
}

export async function updateUserPlan(id, plan) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ plan }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao alterar plano.');
  }
  return res.json();
}

export async function updateUserStatus(id, active) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ active }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao alterar status.');
  }
  return res.json();
}

export async function grantUserCredits(id, amount) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/grant-credits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ amount }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao conceder créditos.');
  }
  return res.json();
}

// ─────── SESSIONS ──────────────
export async function getMe() {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar usuário.');
  return res.json();
}

export async function createCheckoutSession() {
  const res = await fetch(`${BASE_URL}/billing/checkout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao criar sessão de pagamento.');
  return res.json();
}

export async function getBillingPortalUrl() {
  const res = await fetch(`${BASE_URL}/billing/portal`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao abrir portal.');
  }
  return res.json();
}

export async function renameSession(id, titulo) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ titulo }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao renomear sessão.');
  }
  return res.json();
}

export async function getSessionEntities(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}/entities`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar entidades.');
  return res.json();
}

export async function gerarProntuario(sessionId) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/prontuario`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao gerar resumo para prontuário.');
  }
  return res.json();
}

export async function downloadSessionPdf(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}/pdf`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao gerar PDF.');
  }
  return res.blob();
}

export async function classificarLesao(arquivo) {
  const formData = new FormData();
  formData.append('imagem', arquivo);
  const res = await fetch(`${BASE_URL}/skin/classificar`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao classificar imagem.');
  }
  return res.json();
}

export async function verifyEmail(token) {
  const res = await fetch(`${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Link inválido ou expirado.');
  }
  return res.json();
}

export async function resendVerification(email) {
  const res = await fetch(`${BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao reenviar email.');
  }
  return res.json();
}

export async function forgotPassword(email) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao solicitar redefinição.');
  }
  return res.json();
}

export async function resetPassword(token, nova_senha) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, nova_senha }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao redefinir senha.');
  }
  return res.json();
}
