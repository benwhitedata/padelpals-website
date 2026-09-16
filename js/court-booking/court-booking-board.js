/**
 * Day-board layout and paint helpers.
 * Port of CourtDayBoardLayout / CourtDayBoardView in CourtBookingSheetView.swift
 */
(function (global) {
  'use strict';

  var ROW_HEIGHT = 64;
  var HOUR_MS = 3600 * 1000;
  var OCCUPANCY_GAP = 4;
  var PALETTE = [
    '#3B82F6', '#14B8A6', '#8B5CF6', '#F43F5E',
    '#F59E0B', '#84CC16', '#0EA5E9', '#D946EF',
    '#FB7185', '#6366F1', '#10B981', '#22D3EE'
  ];

  function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    var text = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return new Date(text + 'T00:00:00+01:00');
    }
    var date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
  }

  function heightFor(durationMs) {
    return Math.max(1, (durationMs / HOUR_MS) * ROW_HEIGHT);
  }

  function paletteColor(index) {
    var i = Math.max(0, Math.min(PALETTE.length - 1, Number(index) || 0));
    return PALETTE[i];
  }

  function occupancyId(court, slot) {
    if (slot.booking_id) return 'b-' + slot.booking_id;
    if (slot.hold_id) return 'h-' + slot.hold_id;
    if (slot.offering_id) return 'o-' + slot.offering_id + '-' + Number(parseDate(slot.starts_at));
    return court.id + '-' + Number(parseDate(slot.starts_at));
  }

  function occupanciesFor(court) {
    var seen = {};
    var result = [];
    (court.slots || []).forEach(function (slot) {
      var state = slot.state;
      if (state !== 'mine' && state !== 'booked' && state !== 'held' && state !== 'listed' && state !== 'lesson') {
        return;
      }
      var occ = {
        court: court,
        slot: slot,
        startsAt: parseDate(slot.occupancy_starts_at || slot.starts_at),
        endsAt: parseDate(slot.occupancy_ends_at || slot.ends_at)
      };
      var id = occupancyId(court, slot);
      if (!seen[id] && occ.startsAt && occ.endsAt) {
        seen[id] = true;
        occ.id = id;
        result.push(occ);
      }
    });
    return result;
  }

  function mergeGaps(gaps) {
    if (!gaps.length) return [];
    var merged = [];
    var current = gaps[0];
    for (var i = 1; i < gaps.length; i++) {
      var next = gaps[i];
      if (Math.abs(next.startsAt - current.endsAt) < 1000) {
        current = {
          court: current.court,
          startsAt: current.startsAt,
          endsAt: next.endsAt,
          slot: current.slot
        };
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
    return merged;
  }

  function gapsFor(court, occupancies) {
    var minimum = 15 * 60 * 1000 - 1000;
    var result = [];
    (court.slots || []).forEach(function (slot) {
      var slotStart = parseDate(slot.starts_at);
      var slotEnd = parseDate(slot.ends_at);
      if (!slotStart || !slotEnd) return;
      var covering = occupancies
        .filter(function (occ) { return occ.startsAt < slotEnd && occ.endsAt > slotStart; })
        .sort(function (a, b) { return a.startsAt - b.startsAt; });
      if (!covering.length) return;
      var cursor = slotStart;
      covering.forEach(function (occ) {
        var occupiedStart = Math.max(occ.startsAt, slotStart);
        if (occupiedStart - cursor >= minimum) {
          result.push({
            court: court,
            startsAt: cursor,
            endsAt: occupiedStart,
            slot: vacantSlot(cursor, occupiedStart)
          });
        }
        cursor = Math.max(cursor, Math.min(occ.endsAt, slotEnd));
      });
      if (slotEnd - cursor >= minimum) {
        result.push({
          court: court,
          startsAt: cursor,
          endsAt: slotEnd,
          slot: vacantSlot(cursor, slotEnd)
        });
      }
    });
    return mergeGaps(result);
  }

  function vacantSlot(startsAt, endsAt) {
    return {
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      state: 'free',
      label: null,
      booked_for_name: null,
      staff_note: null,
      is_default_type: true,
      booking_id: null,
      hold_id: null,
      occupancy_starts_at: null,
      occupancy_ends_at: null,
      booking_type_id: null,
      colour_index: null,
      hold_recurrence: null,
      offering_id: null
    };
  }

  function tracksFor(court, occupancies) {
    return (court.slots || []).map(function (slot) {
      var start = parseDate(slot.starts_at);
      var end = parseDate(slot.ends_at);
      var occupied = occupancies.some(function (occ) {
        return occ.startsAt < end && occ.endsAt > start;
      });
      var kind = 'free';
      if (occupied) kind = 'leftover';
      else if (slot.state === 'locked') kind = 'locked';
      return { startsAt: start, endsAt: end, slot: slot, kind: kind };
    });
  }

  function hourTicks(start, end) {
    if (end - start <= 1000) return [];
    var ticks = [];
    var cursor = start;
    while (cursor - end < -500) {
      var next = Math.min(cursor + HOUR_MS, end);
      ticks.push({ startsAt: new Date(cursor), endsAt: new Date(next) });
      cursor = next;
    }
    return ticks;
  }

  function buildLayout(courts) {
    var list = Array.isArray(courts) ? courts : [];
    var allSlots = [];
    list.forEach(function (court) {
      (court.slots || []).forEach(function (slot) { allSlots.push(slot); });
    });
    var starts = allSlots.map(function (s) { return parseDate(s.starts_at); }).filter(Boolean);
    var ends = allSlots.map(function (s) { return parseDate(s.ends_at); }).filter(Boolean);
    var boardStart = starts.length ? new Date(Math.min.apply(null, starts)) : new Date();
    var boardEnd = ends.length ? new Date(Math.max.apply(null, ends)) : boardStart;
    var first = list[0] && list[0].slots && list[0].slots[0];
    var slotDuration = first
      ? (parseDate(first.ends_at) - parseDate(first.starts_at))
      : HOUR_MS;
    var columns = list.map(function (court) {
      var occupancies = occupanciesFor(court);
      return {
        court: court,
        occupancies: occupancies,
        tracks: tracksFor(court, occupancies),
        gaps: gapsFor(court, occupancies)
      };
    });
    return {
      boardStart: boardStart,
      boardEnd: boardEnd,
      hours: hourTicks(boardStart.getTime(), boardEnd.getTime()),
      columns: columns,
      slotDuration: slotDuration,
      boardHeight: heightFor(boardEnd - boardStart)
    };
  }

  function occupancyTitle(slot, showPlayerNames) {
    var state = slot.state;
    var label = slot.label;
    if (state === 'listed') {
      return label ? 'Listed · ' + label : 'Lesson listed';
    }
    if (state === 'lesson') {
      return label || 'Lesson';
    }
    if (state === 'mine' || state === 'booked') {
      if (slot.is_default_type !== false) {
        if (showPlayerNames && slot.booked_for_name) return slot.booked_for_name;
        if (state === 'mine') return 'Your booking';
      } else if (slot.staff_note) {
        return slot.staff_note;
      }
      if (label) return label;
      return state === 'mine' ? 'Your booking' : 'Booked';
    }
    if (label) return label;
    if (state === 'held') return 'Held';
    return 'Busy';
  }

  function occupancyFill(slot) {
    if (slot.state === 'held') return 'rgba(245, 158, 11, 0.55)';
    if (slot.state === 'listed') return 'rgba(20, 184, 166, 0.38)';
    if (slot.state === 'lesson') return 'rgba(20, 184, 166, 0.72)';
    if (slot.state === 'mine' && slot.is_default_type !== false) return 'rgba(34, 197, 94, 0.78)';
    var hex = paletteColor(slot.colour_index);
    return hex;
  }

  function occupancyFrame(layout, startsAt, endsAt) {
    var boardStart = layout.boardStart.getTime();
    var boardEnd = layout.boardEnd.getTime();
    if (boardEnd <= boardStart) return { y: 0, height: ROW_HEIGHT };
    var start = Math.max(startsAt.getTime(), boardStart);
    var end = Math.min(endsAt.getTime(), boardEnd);
    var y = heightFor(start - boardStart);
    var height = Math.max(10, heightFor(end - start) - OCCUPANCY_GAP);
    return { y: y, height: height };
  }

  global.CourtBookingBoard = {
    ROW_HEIGHT: ROW_HEIGHT,
    PALETTE: PALETTE,
    parseDate: parseDate,
    heightFor: heightFor,
    paletteColor: paletteColor,
    buildLayout: buildLayout,
    occupancyTitle: occupancyTitle,
    occupancyFill: occupancyFill,
    occupancyFrame: occupancyFrame,
    vacantSlot: vacantSlot
  };
})(window);
