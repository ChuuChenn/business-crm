import { describe, expect, it } from 'vitest';
import { isPermissionKey } from '../authz';
import {
  ALL_MACHINES,
  InvalidTransitionError,
  allowedEvents,
  assertTransition,
  canTransition,
  commissionMachine,
  commissionPeriodMachine,
  inventoryDocumentMachine,
  orderMachine,
  priceExceptionMachine,
  refundMachine,
  stockUnitMachine,
  toMermaid,
} from './index';

describe.each(ALL_MACHINES.map((m) => [m.id, m] as const))('state machine %s', (_id, m) => {
  const states = new Set<string>(m.states);

  it('mọi trạng thái tham chiếu đều đã khai báo và có nhãn tiếng Việt', () => {
    for (const s of [...m.initial, ...m.terminal]) expect(states.has(s)).toBe(true);
    for (const t of m.transitions) {
      expect(states.has(t.to)).toBe(true);
      for (const f of t.from) expect(states.has(f)).toBe(true);
    }
    for (const s of m.states) expect((m.stateLabels as Record<string, string>)[s]).toBeTruthy();
  });

  it('trạng thái kết thúc không có chuyển tiếp ra', () => {
    for (const s of m.terminal) {
      expect(allowedEvents(m as never, s as never)).toEqual([]);
    }
  });

  it('mọi trạng thái đều đến được từ trạng thái khởi đầu', () => {
    const seen = new Set<string>(m.initial);
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of m.transitions) {
        if (t.from.some((f) => seen.has(f)) && !seen.has(t.to)) {
          seen.add(t.to);
          changed = true;
        }
      }
    }
    expect([...seen].sort()).toEqual([...states].sort());
  });

  it('một sự kiện từ một trạng thái chỉ dẫn tới một đích (tất định)', () => {
    const pairs = new Set<string>();
    for (const t of m.transitions) {
      for (const f of t.from) {
        const k = `${f}:${t.event}`;
        expect(pairs.has(k)).toBe(false);
        pairs.add(k);
      }
    }
  });

  it('quyền tham chiếu tồn tại trong danh mục quyền', () => {
    for (const t of m.transitions) {
      if (t.permission) expect(isPermissionKey(t.permission)).toBe(true);
    }
  });

  it('sinh được sơ đồ Mermaid', () => {
    expect(toMermaid(m as never)).toContain('stateDiagram-v2');
  });
});

describe('quy tắc nghiệp vụ trên state machine', () => {
  it('đơn nháp chỉ xác nhận được qua CONFIRM và đơn đã hoàn tất không thể hủy', () => {
    expect(assertTransition(orderMachine, 'DRAFT', 'CONFIRM').to).toBe('CONFIRMED');
    expect(() => assertTransition(orderMachine, 'COMPLETED', 'CANCEL')).toThrow(
      InvalidTransitionError,
    );
    expect(canTransition(orderMachine, 'ISSUED', 'CANCEL')).toBe(false);
  });

  it('xác nhận đơn yêu cầu kiểm tra giá sàn hoặc phê duyệt cho đúng phiên bản', () => {
    const t = assertTransition(orderMachine, 'DRAFT', 'CONFIRM');
    expect(t.guards?.join(' ')).toMatch(/priceExceptionApprovedForCurrentVersion/);
    expect(t.guards).toContain('expectedVersionMatches');
  });

  it('phê duyệt giá sàn: chỉ giám đốc; đã duyệt vẫn bị vô hiệu khi đơn thay đổi', () => {
    expect(assertTransition(priceExceptionMachine, 'PENDING', 'APPROVE').permission).toBe(
      'price_exception.approve',
    );
    expect(assertTransition(priceExceptionMachine, 'APPROVED', 'INVALIDATE').to).toBe(
      'INVALIDATED',
    );
    expect(canTransition(priceExceptionMachine, 'CONSUMED', 'APPROVE')).toBe(false);
    expect(canTransition(priceExceptionMachine, 'EXPIRED', 'CONSUME')).toBe(false);
  });

  it('chứng từ kho đã ghi sổ không thể sửa/hủy, chỉ đảo bởi quyền giám đốc', () => {
    expect(allowedEvents(inventoryDocumentMachine, 'POSTED')).toEqual(['REVERSE']);
    expect(assertTransition(inventoryDocumentMachine, 'POSTED', 'REVERSE').permission).toBe(
      'inventory.reverse',
    );
  });

  it('serial chỉ xuất được khi đang được giữ cho đơn; đã bán không thể xuất lại', () => {
    expect(canTransition(stockUnitMachine, 'AVAILABLE', 'ISSUE')).toBe(false);
    expect(canTransition(stockUnitMachine, 'SOLD', 'ISSUE')).toBe(false);
    expect(canTransition(stockUnitMachine, 'RESERVED', 'ISSUE')).toBe(true);
  });

  it('hoàn tiền: duyệt và thực hiện chỉ bằng quyền giám đốc; thất bại không thành công', () => {
    expect(assertTransition(refundMachine, 'REQUESTED', 'APPROVE').permission).toBe(
      'refund.approve',
    );
    expect(assertTransition(refundMachine, 'APPROVED', 'EXECUTE').permission).toBe(
      'refund.execute',
    );
    expect(canTransition(refundMachine, 'REQUESTED', 'SUCCEED')).toBe(false);
    expect(canTransition(refundMachine, 'FAILED', 'SUCCEED')).toBe(false);
  });

  it('hoa hồng đã chi và kỳ đã chốt là bất biến', () => {
    expect(allowedEvents(commissionMachine, 'PAID')).toEqual([]);
    expect(canTransition(commissionMachine, 'APPROVED', 'VOID')).toBe(false);
    expect(allowedEvents(commissionPeriodMachine, 'CLOSED')).toEqual([]);
  });
});
