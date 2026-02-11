export function getTodayKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().slice(0, 10);
}

export function calcIsOverdue(dueDate: string, status: 'pending' | 'completed'): boolean {
  return status === 'pending' && getTodayKST() > dueDate;
}
