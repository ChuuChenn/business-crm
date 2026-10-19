import type { PermissionKey } from '../authz/permissions';

/**
 * State machine khai báo. Đây là nguồn sự thật duy nhất cho các chuyển trạng thái hợp lệ;
 * service backend phải gọi `assertTransition` trước khi ghi trạng thái mới, và cột trạng thái
 * trong DB chỉ thay đổi trong transaction kèm audit log.
 *
 * `guards` là tên các điều kiện nghiệp vụ mà service phải kiểm tra (được liệt kê để tài liệu hóa
 * và để test bao phủ); chúng không được thực thi bởi lớp này.
 */
export interface TransitionDef<S extends string, E extends string> {
  event: E;
  from: readonly S[];
  to: S;
  permission?: PermissionKey;
  guards?: readonly string[];
  description: string;
}

export interface MachineDef<S extends string, E extends string> {
  id: string;
  label: string;
  states: readonly S[];
  stateLabels: Record<S, string>;
  initial: readonly S[];
  terminal: readonly S[];
  transitions: readonly TransitionDef<S, E>[];
}

export class InvalidTransitionError extends Error {
  readonly code = 'INVALID_STATE_TRANSITION';
  constructor(
    readonly machine: string,
    readonly from: string,
    readonly event: string,
  ) {
    super(`[${machine}] Không thể thực hiện "${event}" từ trạng thái "${from}"`);
    this.name = 'InvalidTransitionError';
  }
}

export function defineMachine<const S extends string, const E extends string>(
  def: MachineDef<S, E>,
): MachineDef<S, E> {
  return def;
}

export function findTransition<S extends string, E extends string>(
  m: MachineDef<S, E>,
  from: S,
  event: E,
): TransitionDef<S, E> | undefined {
  return m.transitions.find((t) => t.event === event && t.from.includes(from));
}

export function canTransition<S extends string, E extends string>(
  m: MachineDef<S, E>,
  from: S,
  event: E,
): boolean {
  return findTransition(m, from, event) !== undefined;
}

export function assertTransition<S extends string, E extends string>(
  m: MachineDef<S, E>,
  from: S,
  event: E,
): TransitionDef<S, E> {
  const t = findTransition(m, from, event);
  if (!t) throw new InvalidTransitionError(m.id, from, event);
  return t;
}

export function allowedEvents<S extends string, E extends string>(m: MachineDef<S, E>, from: S): E[] {
  return m.transitions.filter((t) => t.from.includes(from)).map((t) => t.event);
}

/** Mermaid stateDiagram để sinh tài liệu. */
export function toMermaid<S extends string, E extends string>(m: MachineDef<S, E>): string {
  const lines = ['stateDiagram-v2'];
  for (const s of m.initial) lines.push(`  [*] --> ${s}`);
  for (const t of m.transitions) {
    for (const f of t.from) lines.push(`  ${f} --> ${t.to}: ${t.event}`);
  }
  for (const s of m.terminal) lines.push(`  ${s} --> [*]`);
  return lines.join('\n');
}
