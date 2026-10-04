export class NotificationToast {
  private static container: HTMLElement | null = null;

  private static init(): void {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  public static show(message: string, type: 'info' | 'success' | 'warn' = 'info'): void {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'warn' ? '⚠' : 'ℹ'}</span>
      <span class="toast-text">${message}</span>
    `;

    this.container!.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-exit');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3200);
  }
}
