// Inventory.ts

export interface InventoryItem {
  id: string; // "ticket", "milk-bottle", etc.
  name: string;
  quantity: number;
}

class Inventory {
  private items: Record<string, InventoryItem> = {};

  addItem(id: string, name: string, qty: number = 1) {
    if (!this.items[id]) {
      this.items[id] = { id, name, quantity: qty };
    } else {
      this.items[id].quantity += qty;
    }
    console.log(`Added: ${name} x${qty}`);
  }

  removeItem(id: string, qty: number = 1) {
    if (!this.items[id]) return;

    this.items[id].quantity -= qty;
    if (this.items[id].quantity <= 0) {
      delete this.items[id];
    }

    console.log(`Removed: ${id} x${qty}`);
  }

  hasItem(id: string, qty: number = 1): boolean {
    return this.items[id] && this.items[id].quantity >= qty;
  }

  getItems(): InventoryItem[] {
    return Object.values(this.items);
  }
}

export const inventory = new Inventory();
