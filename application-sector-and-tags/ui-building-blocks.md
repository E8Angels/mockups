# UI building blocks to reuse

Surveyed on main at `d346bbd5` (2026-09-25).

- **There is no tree or hierarchical picker anywhere yet.** The tag picker is new.
- **Grid filters only match exact values.** That's why the plan puts `tag_ids_expanded` on each row: the existing operators then work unchanged.

## Libraries already installed

- Radix, via shadcn-style wrappers in `src/components/ui/`: popover, dropdown-menu, select, dialog, tooltip, checkbox, scroll-area, tabs, toggle
- `cmdk` ^1.1.1
- `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- No MUI, Headless UI, react-select or downshift

## Primitives

- **`src/components/ui/popover.jsx`:** Radix Popover.
  - `z-[20000]`.
  - `portalled` prop, default true. Pass `false` inside Sheets and Dialogs, as RecordGrid does.
  - Default size `w-72 p-4`.
- **`src/components/ui/command.jsx`:** cmdk (Command, CommandInput, CommandList `max-h-[300px]`, CommandGroup, CommandItem, CommandEmpty).
- **`src/components/ui/select.jsx`:** the design guide requires this shared Select for dropdowns.
- **`src/components/ui/badge.jsx`:** cva Badge.
- **`src/components/ui/tooltip.jsx`.**

## Closest patterns

- **Tag picker base:** `src/components/ui/region-combobox.jsx`.
  - Popover + cmdk with grouped `CommandGroup heading` sections.
  - It filters on a composed `value` string (`"${name} ${abbr}"`), so the same trick puts each tag's full path and synonyms into its search text.
  - It is single-select, so the tag picker adds checkboxes and the tree mode.
- **Filter dropdown:** `src/components/MultiSelectDropdown.jsx`.
  - Supports `options`, grouped `sections`, `searchable` (substring on the label), checkbox rows, a count badge and "Clear selection".
  - Not cmdk-based, and no keyboard navigation between items.
  - Keep it for the Sector filter.
- **Value editor with pills:** `src/components/ui/multi-select-picker.jsx` (`MultiSelectPicker`).
  - Removable blue pills, a flat checkbox list, no search.
  - Used today for secondary categories in `UnifiedRecordIsland.jsx` ~1548.
- **Category pill:** `src/components/CategoryPill.jsx`, an outline Badge tinted from the managed-list colour (`src/lib/category-colors.js`, `/api/lists/category-colors`). It becomes `SectorPill`.
- **People pills:** `ContactPill` in `src/islands/ContactPillsEditor.jsx` ~41. It's the reference for pill sizing and `compact` mode.
- **"+N" overflow in a grid cell:** `CompaniesAdminIsland.jsx` ~1531–1556 (portfolio investors). Grid cells must stay on one line so the virtualizer doesn't desync. Today the full list is only in a native `title`, and the design guide says a tooltip mustn't be the only way to see essential information. So the Tags `+N` button opens a popover.

## Grid filter plumbing

- **Filter UI:** `src/components/record-grid/RecordGrid.jsx`.
  - `FilterConditionEditor` ~3184: field picker → operator Select → value control. For `multi_select` fields it renders `MultiSelectDropdown`.
  - `getRecordGridFieldOptions` ~2824 merges config options with the server's `filterOptions`.
  - `RECORD_GRID_MULTI_SELECT_SECTIONS` ~642 feeds grouped options; only `furthest_stage` uses it today.
  - Operator labels ~589 and ~616.
- **Operators:** `lib/admin-grid-config.js` ~12 `FIELD_TYPE_OPERATORS`. `multi_select` has `has_any_of`, `has_all_of`, `has_none_of`, `is_empty` and `is_not_empty`. At ~1459, `is`/`is_not` on a multi-select is rewritten to `has_any_of`/`has_none_of`.
- **Evaluation happens in JavaScript over loaded rows:**
  - `_applyAdminGridFiltersToRows` (`lib/cache-manager.js` ~45259, called ~43636 and ~45006) inside `executeAdminGridQueryPlan` ~42482
  - the same logic on the client in `evaluateRowColorRule` (`RecordGrid.jsx` ~1013)
  - matching is lowercased exact values
- **Options:** server-provided via `_buildAdminGridFilterOptionsForTable` ~42444 and its cache (~35767). Companies take them from managed lists (~45452); applications and portfolio take distinct row values.

## Company header layout

The full page (`/company/:id`) and the flyout (`src/components/unified-record/CompanyPanelSheet.jsx`) both render `UnifiedRecordView` from `src/islands/UnifiedRecordIsland.jsx`.

- **~1490:** header card.
- **~1594–1609:** row 1 is the name, "· website", the primary category pill, then the status pill.
- **Row 2:** tagline or blurb.
- **~1611–1660:** the meta line.
- **~1537–1556:** edit mode.
- **~1692:** application switcher.

The Tags pill goes right after the Sector pill in row 1.

## Design guide rules that apply (`docs/design-guide.md`)

- Pills are only as wide as their content (`w-fit`).
- Layouts are compact and dense.
- Use the shared Select, and checkboxes for multi-select membership.
- Search placeholders read "Search X…", and an icon needs left padding.
- Filters go on the left of a controls row, actions and count on the right.
- A tooltip is never the only path to essential information.
- UI copy is minimal. Never describe how a control works (Jordan's standing rule).
