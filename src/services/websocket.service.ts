import Cookies from 'js-cookie';

export const WS_EVENTS = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_PAID: 'ORDER_PAID',
  ORDER_VOIDED: 'ORDER_VOIDED',
  ORDER_PREP_UPDATE: 'ORDER_PREP_UPDATE',
};

type WSCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, WSCallback[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1').replace('http', 'ws');

  connect() {
    if (this.socket || typeof window === 'undefined') return;

    const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
    if (!token) {
      console.warn('[WS] No token found');
      return;
    }

    // Backend expects /ws/kds
    const wsUrl = `${this.baseUrl}/ws/kds`;
    console.log(`[WS] Connecting to ${wsUrl}`);

    // Use protocol to pass token as Fiber websocket middleware might expect it
    this.socket = new WebSocket(wsUrl, ['Bearer', token]);

    this.socket.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const callbacks = this.listeners.get(data.type);
        if (callbacks) {
          callbacks.forEach(cb => cb(data.data));
        }
      } catch (e) {
        console.error('[WS] Parse error', e);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.attemptReconnect();
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Error', err);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 5000);
    }
  }

  on(event: string, callback: WSCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: WSCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService();
