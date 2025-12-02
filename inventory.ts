// Inventory.ts

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

type InventoryListener = () => void;

class Inventory {
  private items: Record<string, InventoryItem> = {};
  private listeners: InventoryListener[] = [];

  // --- Event system so UI can update ---
  onChange(listener: InventoryListener) {
    this.listeners.push(listener);
  }

  private emitChange() {
    for (const l of this.listeners) l();
  }

  // --- Inventory functions ---
  addItem(id: string, name: string, qty: number = 1) {
    if (!this.items[id]) {
      this.items[id] = { id, name, quantity: qty };
    } else {
      this.items[id].quantity += qty;
    }
    console.log(`Added: ${name} x${qty}`);
    this.emitChange();
  }

  removeItem(id: string, qty: number = 1) {
    if (!this.items[id]) return;

    this.items[id].quantity -= qty;
    if (this.items[id].quantity <= 0) {
      delete this.items[id];
    }

    console.log(`Removed: ${id} x${qty}`);
    this.emitChange();
  }

  hasItem(id: string, qty: number = 1): boolean {
    return this.items[id] && this.items[id].quantity >= qty;
  }

  getItems(): InventoryItem[] {
    return Object.values(this.items);
  }
}

export const inventory = new Inventory();
