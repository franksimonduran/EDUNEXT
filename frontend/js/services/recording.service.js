import { isMediaRecorderSupported } from './microphone.service.js';

export class RecordingService {
 constructor() {
  this.mediaRecorder = null;
  this.chunks = [];
  this.stream = null;
  this.blob = null;
  this.url = null;
 }

 start(stream, options = {}) {
  if (!isMediaRecorderSupported()) throw new Error('unsupported');
  this.stop();
  this.chunks = [];
  this.blob = null;
  if (this.url) { try { URL.revokeObjectURL(this.url); } catch {} this.url = null; }
  this.stream = stream;
  const mimeType = options.mimeType || (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm');
  this.mediaRecorder = new MediaRecorder(stream, { mimeType });
  this.mediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) this.chunks.push(e.data); };
  this.mediaRecorder.start();
  return this.mediaRecorder;
 }

 stop() {
  if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
   try { this.mediaRecorder.stop(); } catch {}
  }
  this.mediaRecorder = null;
 }

 getBlob() {
  if (this.chunks.length === 0) return null;
  const type = this.mediaRecorder?.mimeType || 'audio/webm';
  this.blob = new Blob(this.chunks, { type });
  return this.blob;
 }

 getURL() {
  const blob = this.getBlob();
  if (!blob) return null;
  if (this.url) { try { URL.revokeObjectURL(this.url); } catch {} }
  this.url = URL.createObjectURL(blob);
  return this.url;
 }

 clear() {
  this.chunks = [];
  this.blob = null;
  if (this.url) { try { URL.revokeObjectURL(this.url); } catch {} this.url = null; }
 }

 destroy() {
  this.stop();
  this.clear();
  this.stream = null;
 }
}

export const recordingService = new RecordingService();
