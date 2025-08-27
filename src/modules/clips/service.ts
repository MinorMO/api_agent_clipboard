import { nanoid } from 'nanoid';
import { addDays, isAfter, isBefore, subDays } from 'date-fns';
import { CreateTextClipInput, LatestQueryInput, RangeQueryInput } from './dto';
import { insertClip, getLatestNonExpired, listRange, getClipById, type ClipRow } from './repo';
import { isMember } from '../channels/repo';
import { bus } from '../../core/eventBus';

type EnvLike = { RETENTION_DAYS: number };

export const clipsService = {
  createText: (input: CreateTextClipInput, userId: string, env: EnvLike) => {
    // seguridad: el usuario debe ser miembro del canal
    if (!isMember(input.channelId, userId)) {
      const e: any = new Error('No eres miembro de este canal');
      e.status = 403; e.code = 'NOT_A_MEMBER';
      throw e;
    }
    const now = new Date();
    const exp = addDays(now, env.RETENTION_DAYS);
    const row: ClipRow = {
      id: nanoid(),
      channel_id: input.channelId,
      user_id: userId,
      type: 'text',
      text_content: input.text,
      created_at: now.toISOString(),
      expires_at: exp.toISOString(),
    };
    insertClip(row);
    bus.emit('clip.created', {
      type: 'clip.created',
      channelId: input.channelId,
      clipId: row.id,
      by: userId,
      at: now.toISOString()
    });
    return sanitize(row);
  },

  latest: (q: LatestQueryInput, userId: string) => {
    if (!isMember(q.channelId, userId)) {
      const e: any = new Error('No eres miembro de este canal');
      e.status = 403; e.code = 'NOT_A_MEMBER';
      throw e;
    }
    const row = getLatestNonExpired(q.channelId, new Date().toISOString());
    if (!row) {
      const e: any = new Error('No hay clips');
      e.status = 404; e.code = 'NO_CLIPS';
      throw e;
    }
    return sanitize(row);
  },

  list: (q: RangeQueryInput, userId: string) => {
    if (!isMember(q.channelId, userId)) {
      const e: any = new Error('No eres miembro de este canal');
      e.status = 403; e.code = 'NOT_A_MEMBER';
      throw e;
    }

    // Ventana por defecto: último 1 día
    const now = new Date();
    const defaultFrom = subDays(now, 1);

    const from = q.from ? new Date(q.from) : defaultFrom;
    const to = q.to ? new Date(q.to) : now;

    // Normalizaciones:
    // - Si from > to, intercambiamos
    let fromN = from;
    let toN = to;
    if (isAfter(fromN, toN)) {
      const tmp = fromN; fromN = toN; toN = tmp;
    }

    // - Limitar a máximo 7 días de ventana
    const maxWindowStart = subDays(toN, 7);
    if (isBefore(fromN, maxWindowStart)) {
      fromN = maxWindowStart;
    }

    const rows = listRange(q.channelId, fromN.toISOString(), toN.toISOString(), q.limit ?? 50);
    return rows.map(sanitize);
  },

  getById: (clipId: string, userId: string) => {
    const row = getClipById(clipId);
    if (!row) {
      const e: any = new Error('Clip no existe');
      e.status = 404; e.code = 'CLIP_NOT_FOUND';
      throw e;
    }
    // El usuario debe pertenecer al canal del clip
    if (!isMember(row.channel_id, userId)) {
      const e: any = new Error('No eres miembro de este canal');
      e.status = 403; e.code = 'NOT_A_MEMBER';
      throw e;
    }
    return sanitize(row);
  },
};

function sanitize(r: ClipRow) {
  return {
    id: r.id,
    channelId: r.channel_id,
    userId: r.user_id,
    type: r.type,
    text: r.text_content ?? null,
    created_at: r.created_at,
    expires_at: r.expires_at,
  };
}
