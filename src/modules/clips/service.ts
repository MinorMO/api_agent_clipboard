// src/modules/clips/service.ts
import { nanoid } from 'nanoid';
import { addDays, subDays, isAfter, isBefore } from 'date-fns';
import {
  CreateTextClipInput,
  LatestQueryInput,
  RangeQueryInput,
} from './dto';
import {
  insertClip,
  getLatestNonExpired,
  listRange,
  getClipById,
  type ClipRow,
} from './repo';
import { isMember } from '../channels/repo';
import { bus } from '../../core/eventBus';

type EnvLike = { RETENTION_DAYS: number };

function boom(status: number, code: string, message: string): never {
  const e: any = new Error(message);
  e.status = status;
  e.code = code;
  throw e;
}

function sanitize(r: ClipRow) {
  return {
    id: r.id,
    channelId: r.channel_id,
    userId: r.user_id,
    type: r.type,                        // 'text' | 'files'
    text: r.text_content ?? '',          // útil para el agente
    created_at: r.created_at,
    expires_at: r.expires_at,
  };
}

export const clipsService = {
  createText(input: CreateTextClipInput, userId: string, env: EnvLike) {
    if (!isMember(input.channelId, userId)) {
      boom(403, 'NOT_A_MEMBER', 'No eres miembro de este canal');
    }

    const now = new Date();
    const exp = addDays(now, env.RETENTION_DAYS);

    const txt = (input.text ?? '').trim();
    const isFiles = txt.length === 0;    // si no hay texto, tratamos como “clip de archivos”

    const row: ClipRow = {
      id: nanoid(),
      channel_id: input.channelId,
      user_id: userId,
      type: isFiles ? 'files' : 'text',
      text_content: isFiles ? 'Archivo' : txt, // placeholder
      created_at: now.toISOString(),
      expires_at: exp.toISOString(),
    };

    insertClip(row);

    bus.emit('clip.created', {
      type: 'clip.created',
      channelId: row.channel_id,
      clipId: row.id,
      by: userId,
      at: now.toISOString(),
    });

    return sanitize(row);
  },

  latest(q: LatestQueryInput, userId: string) {
    if (!isMember(q.channelId, userId)) {
      boom(403, 'NOT_A_MEMBER', 'No eres miembro de este canal');
    }
    const nowIso = new Date().toISOString();
    const row = getLatestNonExpired(q.channelId, nowIso);
    return row ? sanitize(row) : null;
  },

  list(q: RangeQueryInput, userId: string) {
    if (!isMember(q.channelId, userId)) {
      boom(403, 'NOT_A_MEMBER', 'No eres miembro de este canal');
    }

    // Rango por defecto: 24h
    const now = new Date();
    const defaultFrom = subDays(now, 1);

    let from = q.from ? new Date(q.from) : defaultFrom;
    let to   = q.to   ? new Date(q.to)   : now;

    // Si vienen invertidos, los corregimos
    if (isAfter(from, to)) {
      const tmp = from; from = to; to = tmp;
    }

    // Limitar ventana a 7 días hacia atrás desde 'to'
    const maxWindowStart = subDays(to, 7);
    if (isBefore(from, maxWindowStart)) {
      from = maxWindowStart;
    }

    // El repo espera ISO strings, no undefined
    const rows = listRange(
      q.channelId,
      from.toISOString(),
      to.toISOString(),
      q.limit ?? 50
    );

    return rows.map(sanitize);
  },

  getById(clipId: string, userId: string) {
    const row = getClipById(clipId);
    if (!row) {
      boom(404, 'CLIP_NOT_FOUND', 'Clip no encontrado');
    }
    if (!isMember(row.channel_id, userId)) {
      boom(403, 'NOT_A_MEMBER', 'No eres miembro de este canal');
    }
    return sanitize(row);
  },
};
