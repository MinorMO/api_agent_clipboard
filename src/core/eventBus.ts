import { EventEmitter } from 'events';
export const bus = new EventEmitter();
// Eventos emitidos:
// 'clip.created'   -> { type:'clip.created', channelId, clipId, by, at }
// 'files.uploaded' -> { type:'files.uploaded', channelId, clipId, by, files:[{id,filename,mime,size}], at }
