import { Platform } from 'react-native';

interface WebSocketEventMap {
  open: WebSocketOpenEvent;
  close: WebSocketCloseEvent;
  error: WebSocketErrorEvent;
  message: WebSocketMessageEvent;
}

interface WebSocketOpenEvent {
  type: 'open';
}

interface WebSocketCloseEvent {
  type: 'close';
  code: number;
  reason: string;
}

interface WebSocketErrorEvent {
  type: 'error';
  message: string;
}

interface WebSocketMessageEvent {
  type: 'message';
  data: string;
}

class CustomWebSocket {
  private ws: WebSocket;
  private listeners: { [K in keyof WebSocketEventMap]?: ((event: WebSocketEventMap[K]) => void)[] };

  constructor(url: string, protocols?: string | string[]) {
    // Use the native WebSocket implementation
    this.ws = new WebSocket(url, protocols);
    this.listeners = {};

    // Forward the WebSocket events
    this.ws.onopen = () => this.emit('open', { type: 'open' });
    this.ws.onclose = (event) => this.emit('close', { 
      type: 'close',
      code: event.code,
      reason: event.reason
    });
    this.ws.onerror = (event) => this.emit('error', {
      type: 'error',
      message: event.message
    });
    this.ws.onmessage = (event) => this.emit('message', {
      type: 'message',
      data: event.data
    });
  }

  addEventListener<K extends keyof WebSocketEventMap>(
    event: K,
    callback: (event: WebSocketEventMap[K]) => void
  ) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(callback);
  }

  removeEventListener<K extends keyof WebSocketEventMap>(
    event: K,
    callback: (event: WebSocketEventMap[K]) => void
  ) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]?.filter(cb => cb !== callback);
    }
  }

  send(data: string | ArrayBuffer | ArrayBufferView | Blob) {
    this.ws.send(data);
  }

  close(code?: number, reason?: string) {
    this.ws.close(code, reason);
  }

  private emit<K extends keyof WebSocketEventMap>(event: K, data: WebSocketEventMap[K]) {
    if (this.listeners[event]) {
      this.listeners[event]?.forEach(callback => callback(data));
    }
  }
}

export default CustomWebSocket; 