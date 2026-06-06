export const safeConfirm = (message: string): boolean => {
  try {
    return window.confirm(message);
  } catch (e) {
    // If the browser blocks confirm in iframe sandbox environment, default to true
    // so user actions (deleting products, updating credentials) still complete.
    return true;
  }
};
