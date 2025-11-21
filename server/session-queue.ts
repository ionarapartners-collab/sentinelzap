/**
 * Session initialization queue to prevent concurrent Baileys conflicts
 */

type QueueItem = {
  chipId: number;
  resolve: (result: any) => void;
  reject: (error: any) => void;
};

class SessionQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private initializationInProgress = new Set<number>();

  async add(chipId: number, initFn: () => Promise<any>): Promise<any> {
    // Check if already initializing
    if (this.initializationInProgress.has(chipId)) {
      console.log(`[Queue] ⚠️ Chip ${chipId} is already initializing, skipping duplicate request`);
      throw new Error('Chip is already initializing');
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ chipId, resolve, reject });
      console.log(`[Queue] 📝 Added chip ${chipId} to queue (position: ${this.queue.length})`);
      
      if (!this.processing) {
        this.processQueue(initFn);
      }
    });
  }

  private async processQueue(initFn: () => Promise<any>) {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      console.log(`[Queue] 🔄 Processing chip ${item.chipId} (${this.queue.length} remaining)`);
      
      // Mark as in progress
      this.initializationInProgress.add(item.chipId);

      try {
        const result = await initFn();
        item.resolve(result);
        console.log(`[Queue] ✅ Chip ${item.chipId} initialized successfully`);
      } catch (error) {
        item.reject(error);
        console.error(`[Queue] ❌ Chip ${item.chipId} initialization failed:`, error);
      } finally {
        // Remove from in-progress set
        this.initializationInProgress.delete(item.chipId);
        
        // Wait 2 seconds before processing next item to avoid conflicts
        if (this.queue.length > 0) {
          console.log(`[Queue] ⏳ Waiting 2s before next initialization...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    this.processing = false;
    console.log(`[Queue] ✅ Queue processing completed`);
  }

  isInitializing(chipId: number): boolean {
    return this.initializationInProgress.has(chipId);
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const sessionQueue = new SessionQueue();
