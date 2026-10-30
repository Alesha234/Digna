type OwnerRecord = {
  userId: string;
};

function assertOwner(currentUserId: string, ownerId: string | null | undefined, message: string): void {
  const current: string = typeof currentUserId === "string" ? currentUserId.trim() : "";
  const owner: string = typeof ownerId === "string" ? ownerId.trim() : "";
  if (current === "" || owner === "") {
    throw new Error(message);
  }
  if (current !== owner) {
    throw new Error(message);
  }
}

export function assertCardOwner(currentUserId: string, card: OwnerRecord | null | undefined): void {
  assertOwner(currentUserId, card?.userId, "That card was not found.");
}

export function assertTransactionOwner(currentUserId: string, txn: OwnerRecord | null | undefined): void {
  assertOwner(currentUserId, txn?.userId, "That payment was not found.");
}

export function assertBalanceOwner(currentUserId: string, balance: OwnerRecord | null | undefined): void {
  assertOwner(currentUserId, balance?.userId, "We could not find that balance.");
}

export function assertScanOwner(currentUserId: string, scan: OwnerRecord | null | undefined): void {
  assertOwner(currentUserId, scan?.userId, "That scan was not found.");
}
