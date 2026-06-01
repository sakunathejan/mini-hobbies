import { EventEmitter } from "events";

export const EVENTS = {
  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  ORDER_STATUS_UPDATED: "ORDER_STATUS_UPDATED",
  ORDER_DELIVERED: "ORDER_DELIVERED"
};

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

export function on(event, handler) {
  emitter.on(event, handler);
}

export function off(event, handler) {
  emitter.off(event, handler);
}

export function emit(event, payload) {
  emitter.emit(event, payload);
}

export default { EVENTS, on, off, emit };
