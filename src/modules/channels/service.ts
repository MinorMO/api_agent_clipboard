import { nanoid } from 'nanoid';
import { CreateChannelInput, JoinByCodeInput } from './dto';
import {
  existsChannelNameForOwner, insertChannel, addMember, isOwner, listMyChannels,
  createInvite, getInvite, deleteInvite, isMember, getChannelById
} from './repo';

type EnvLike = { RETENTION_DAYS: number };

export const channelsService = {
  create: (input: CreateChannelInput, userId: string) => {
    const name = input.name.trim();

    // Unicidad por dueño (case-insensitive)
    if (existsChannelNameForOwner(userId, name)) {
      const e: any = new Error('Ya existe un canal con ese nombre');
      e.status = 409; e.code = 'CHANNEL_NAME_TAKEN';
      throw e;
    }

    const id = nanoid();
    const now = new Date().toISOString();
    insertChannel({ id, owner_user_id: userId, name, created_at: now });
    addMember(id, userId, 'owner', now);
    return { id, name, created_at: now, role: 'owner' as const };
  },

  myChannels: (userId: string) => {
    return listMyChannels(userId);
  },

  invite: (channelId: string, userId: string, env: EnvLike) => {
    if (!isOwner(channelId, userId)) {
      const e: any = new Error('Solo el dueño puede invitar');
      e.status = 403; e.code = 'FORBIDDEN';
      throw e;
    }
    const code = nanoid(10).toUpperCase();
    const now = new Date();
    const exp = new Date(now.getTime() + env.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    createInvite(code, channelId, userId, now.toISOString(), exp.toISOString());
    return { code, channelId, expires_at: exp.toISOString() };
  },

  joinByCode: (input: JoinByCodeInput, userId: string) => {
    const inv = getInvite(input.code);
    if (!inv) {
      const e: any = new Error('Código inválido');
      e.status = 404; e.code = 'INVITE_NOT_FOUND';
      throw e;
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      deleteInvite(inv.code);
      const e: any = new Error('Invitación expirada');
      e.status = 410; e.code = 'INVITE_EXPIRED';
      throw e;
    }
    if (isMember(inv.channel_id, userId)) {
      return { joined: true, channel: getChannelById(inv.channel_id) };
    }
    addMember(inv.channel_id, userId, 'member', new Date().toISOString());
    return { joined: true, channel: getChannelById(inv.channel_id) };
  },
};
