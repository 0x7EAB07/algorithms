type GetKey = {
  getKey: () => string;
};

class LruNode<T extends GetKey> {
  public value: T;
  public next: LruNode<T> | null;
  public prev: LruNode<T> | null;

  public constructor(value: T) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

class LruCache<T extends GetKey> {
  private maxSize: number;

  private map: Map<string, LruNode<T>>;
  private head: LruNode<T> | null;
  private tail: LruNode<T> | null;
  private headKey: string | null;
  private tailKey: string | null;

  private setHead(key: string, node: LruNode<T>) {
    this.headKey = key;
    this.head = node;
  }

  private setTail(key: string, node: LruNode<T>) {
    this.tailKey = key;
    this.tail = node;
  }

  public constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.map = new Map<string, LruNode<T>>();
    this.head = null;
    this.tail = null;
    this.headKey = null;
    this.tailKey = null;
  }

  public add(value: T): void {
    const node = new LruNode(value);
    const key = value.getKey();
    // Here we initialize.
    if (!this.head) {
      this.setHead(key, node);
      this.setTail(key, node);
      this.map.set(key, node);
      return;
    }
    const currentSize = this.map.size;

    // If we reached the cap of the Lru we evict the tail.
    if (currentSize >= this.maxSize) {
      const nextTail = this.tail!.next!;
      const node = new LruNode(value);
      nextTail.prev = node;
      node.next = nextTail;

      this.map.delete(this.tailKey!);
      this.setTail(key, node);
      this.map.set(key, node);
      return;
    }

    // Available slot after the current Tail, so append.
    this.tail!.prev = node;
    node.next = this.tail;
    this.setTail(key, node);
    this.map.set(key, node);

    return;
  }

  public get(key: string): T | null {
    if (!this.head) {
      return null;
    }
    const node = this.map.get(key);
    if (!node) {
      return null;
    }

    // If we're getting the head, don't reorder.
    if (key === this.headKey) {
      return node.value;
    }

    // If we're returning the tail, we move it up.
    if (key === this.tailKey) {
      const tailNext = this.tail!.next!;
      tailNext.prev = null; // Remove reference in front of tail for current tail.
      this.tail!.prev = this.head; // Tail references head before it.
      this.head!.next = this.tail; // Head references tail as next.
      this.setHead(key, this.tail!); // Set head key and value.
      this.setTail(tailNext.value.getKey(), tailNext); // Set tail key and value.
      return this.head.value;
    }

    // Swap, relink
    const nodeNext = node.next;
    const nodePrev = node.prev;

    nodeNext!.prev = nodePrev;
    nodePrev!.next = nodeNext;

    this.head.next = node;
    node.prev = this.head;
    this.setHead(key, node);

    return node.value;
  }
}

type GetKeyNumber = GetKey & {
  value: number;
};

(() => {
  const cache = new LruCache<GetKeyNumber>(4);
  cache.add({ value: 1, getKey: () => "kA" });
  cache.add({ value: 2, getKey: () => "kB" });
  cache.add({ value: 3, getKey: () => "kC" });
  cache.add({ value: 4, getKey: () => "kD" });

  console.log("overflowing, evicting tail");
  // Over capacity
  cache.add({ value: 5, getKey: () => "kE" });
  cache.add({ value: 6, getKey: () => "kF" });

  console.log(`getting kF 1 time: ${cache.get("kF")}`);
  console.log(`getting kC 2 times: ${cache.get("kC")}-${cache.get("kC")}`);
})();
