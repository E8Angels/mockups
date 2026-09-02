/* @ds-bundle: {"format":4,"namespace":"E8AngelsDesignSystem_ed2725","components":[{"name":"Avatar","sourcePath":"components/core/Avatar/Avatar.jsx"},{"name":"AvatarStack","sourcePath":"components/core/AvatarStack/AvatarStack.jsx"},{"name":"Badge","sourcePath":"components/core/Badge/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card/Card.jsx"},{"name":"Divider","sourcePath":"components/core/Divider/Divider.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow/Eyebrow.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag/Tag.jsx"},{"name":"CountChip","sourcePath":"components/data/CountChip/CountChip.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable/DataTable.jsx"},{"name":"EmptyState","sourcePath":"components/data/EmptyState/EmptyState.jsx"},{"name":"GroupHeader","sourcePath":"components/data/GroupHeader/GroupHeader.jsx"},{"name":"RatingCell","sourcePath":"components/data/RatingCell/RatingCell.jsx"},{"name":"RatingMatrix","sourcePath":"components/data/RatingMatrix/RatingMatrix.jsx"},{"name":"SEGMENTED_SCALES","sourcePath":"components/data/SegmentedRating/SegmentedRating.jsx"},{"name":"SegmentedRating","sourcePath":"components/data/SegmentedRating/SegmentedRating.jsx"},{"name":"Skeleton","sourcePath":"components/data/Skeleton/Skeleton.jsx"},{"name":"StatTile","sourcePath":"components/data/StatTile/StatTile.jsx"},{"name":"Field","sourcePath":"components/forms/Field/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input/Input.jsx"},{"name":"SearchInput","sourcePath":"components/forms/SearchInput/SearchInput.jsx"},{"name":"SelectControl","sourcePath":"components/forms/SelectControl/SelectControl.jsx"},{"name":"StageTabs","sourcePath":"components/forms/StageTabs/StageTabs.jsx"},{"name":"Toggle","sourcePath":"components/forms/Toggle/Toggle.jsx"},{"name":"UnderlineTabs","sourcePath":"components/forms/UnderlineTabs/UnderlineTabs.jsx"},{"name":"Icon","sourcePath":"components/media/Icon/Icon.jsx"},{"name":"Wordmark","sourcePath":"components/media/Wordmark/Wordmark.jsx"},{"name":"ActivityRail","sourcePath":"components/portal/ActivityRail/ActivityRail.jsx"},{"name":"ChatFab","sourcePath":"components/portal/ChatFab/ChatFab.jsx"},{"name":"CompanyCard","sourcePath":"components/portal/CompanyCard/CompanyCard.jsx"},{"name":"ConfirmationSummary","sourcePath":"components/portal/ConfirmationSummary/ConfirmationSummary.jsx"},{"name":"CtaBanner","sourcePath":"components/portal/CtaBanner/CtaBanner.jsx"},{"name":"DetailSheet","sourcePath":"components/portal/DetailSheet/DetailSheet.jsx"},{"name":"EventItem","sourcePath":"components/portal/EventItem/EventItem.jsx"},{"name":"MemberRow","sourcePath":"components/portal/MemberRow/MemberRow.jsx"},{"name":"NewsRow","sourcePath":"components/portal/NewsRow/NewsRow.jsx"},{"name":"SectionCard","sourcePath":"components/portal/SectionCard/SectionCard.jsx"},{"name":"SectionHeader","sourcePath":"components/portal/SectionHeader/SectionHeader.jsx"},{"name":"SlackStrip","sourcePath":"components/portal/SlackStrip/SlackStrip.jsx"},{"name":"TopNav","sourcePath":"components/portal/TopNav/TopNav.jsx"}],"sourceHashes":{"components/core/Avatar/Avatar.jsx":"178be779e38d","components/core/AvatarStack/AvatarStack.jsx":"f4c7170b2345","components/core/Badge/Badge.jsx":"df4bb6c4c7fc","components/core/Button/Button.jsx":"07bad400ab01","components/core/Card/Card.jsx":"02ad2e1d4859","components/core/Divider/Divider.jsx":"4a2f1fe4326e","components/core/Eyebrow/Eyebrow.jsx":"ec72ddf436f5","components/core/IconButton/IconButton.jsx":"2735f0aae4d2","components/core/Tag/Tag.jsx":"421d6c4b3c4c","components/data/CountChip/CountChip.jsx":"8256a0cb59b1","components/data/DataTable/DataTable.jsx":"7bb17e0282ba","components/data/EmptyState/EmptyState.jsx":"826c0d7af7b3","components/data/GroupHeader/GroupHeader.jsx":"e30dad101554","components/data/RatingCell/RatingCell.jsx":"e3e46fed3166","components/data/RatingMatrix/RatingMatrix.jsx":"3befbbc1fc1e","components/data/SegmentedRating/SegmentedRating.jsx":"0958f27c5c97","components/data/Skeleton/Skeleton.jsx":"b48c0654bf54","components/data/StatTile/StatTile.jsx":"ebe0e814a6f0","components/forms/Field/Field.jsx":"30a4103ded2b","components/forms/Input/Input.jsx":"010ec6b215e1","components/forms/SearchInput/SearchInput.jsx":"a7b1e1a33329","components/forms/SelectControl/SelectControl.jsx":"4eefc6633b0f","components/forms/StageTabs/StageTabs.jsx":"a8603fa05f63","components/forms/Toggle/Toggle.jsx":"c8cf363a9e40","components/forms/UnderlineTabs/UnderlineTabs.jsx":"fc7adb21b112","components/media/Icon/Icon.jsx":"8b9e1a9cbc60","components/media/Wordmark/Wordmark.jsx":"06ef4b51ba79","components/portal/ActivityRail/ActivityRail.jsx":"91badba4ed54","components/portal/ChatFab/ChatFab.jsx":"cb12918e68dd","components/portal/CompanyCard/CompanyCard.jsx":"e27f771d78d8","components/portal/ConfirmationSummary/ConfirmationSummary.jsx":"48997365709a","components/portal/CtaBanner/CtaBanner.jsx":"efe0417190d2","components/portal/DetailSheet/DetailSheet.jsx":"ee9d1af38410","components/portal/EventItem/EventItem.jsx":"ae4591a3ec03","components/portal/MemberRow/MemberRow.jsx":"73921cce465a","components/portal/NewsRow/NewsRow.jsx":"25bbcfca1140","components/portal/SectionCard/SectionCard.jsx":"dfd5f740b88b","components/portal/SectionHeader/SectionHeader.jsx":"fbcad8c919ae","components/portal/SlackStrip/SlackStrip.jsx":"b7de75ea6a5e","components/portal/TopNav/TopNav.jsx":"1b1eb9c260ca","ui_kits/portal/App.jsx":"0835d756b26e","ui_kits/portal/data.js":"75f246d27c20"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.E8AngelsDesignSystem_ed2725 = window.E8AngelsDesignSystem_ed2725 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Circular member/company avatar with initials fallback on paper grey.
   Live sizes: 26px in stacks, 32px in directory rows, 48px rounded-square
   for company logo tiles (use shape="tile"). */
/* `lead` is destructured only to keep it off the DOM: AvatarStack forwards
   whole team-member objects, and the live product marks diligence leads
   lexically ("(Lead)") with no visual treatment to render. See readme.md
   § Also worth flagging — lead prominence is an open design question. */
function Avatar({
  src,
  name = '',
  initials,
  size = 26,
  shape = 'circle',
  lead,
  style,
  ...rest
}) {
  const label = initials || name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const radius = shape === 'tile' ? 'var(--radius-lg)' : 'var(--radius-circle)';
  return /*#__PURE__*/React.createElement("span", _extends({
    title: name || undefined,
    style: {
      width: size,
      height: size,
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius,
      overflow: 'hidden',
      background: 'var(--paper-200)',
      border: '1px solid var(--white)',
      color: 'var(--text-muted)',
      fontSize: Math.max(9, Math.round(size * 0.4)),
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: '0.02em',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : label);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/AvatarStack/AvatarStack.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Overlapped row of member avatars. The live pipeline card shows initials
   circles for members without a photo, interleaved with real photos, at 26px
   with a -6px overlap, then lists the names in full below. */
function AvatarStack({
  people = [],
  size = 26,
  max = 8,
  overlap = 6,
  style,
  ...rest
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      ...style
    }
  }, rest), shown.map((p, i) => /*#__PURE__*/React.createElement(__ds_scope.Avatar, _extends({
    key: i
  }, p, {
    size: size,
    style: {
      marginLeft: i === 0 ? 0 : -overlap,
      zIndex: i
    }
  }))), extra > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: -overlap,
      height: size,
      padding: '0 8px',
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--paper-200)',
      border: '1px solid var(--white)',
      color: 'var(--text-muted)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-semibold)'
    }
  }, "+", extra));
}
Object.assign(__ds_scope, { AvatarStack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/AvatarStack/AvatarStack.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Status pill. Live tones:
   ok      pale green #F0FDF4 / border #BBF7D0 / text #15803D  ("Attending")
   teal    pale teal wash #ECF5F2 with teal-ink text            (contact chip)
   neutral paper fill with hairline border                      ("Draft Member")
   stage   letterspaced uppercase-ish stage marker              ("D8 - Final")
   amber   pale amber fill / ochre-dark text                    ("Contingent")
   danger  pale red fill / red text                             ("Did not pass")
   dark    filled ink pill, white numeral                       (card count badge) */
const BADGE_TONES = {
  ok: {
    background: 'var(--ok-bg)',
    border: '1px solid var(--ok-border)',
    color: 'var(--ok-text)'
  },
  teal: {
    background: 'var(--teal-wash)',
    border: '1px solid #D6E7E0',
    color: 'var(--teal-link)'
  },
  neutral: {
    background: 'var(--paper-100)',
    border: '1px solid var(--line-200)',
    color: 'var(--text-muted)'
  },
  stage: {
    background: 'var(--ok-bg-alt)',
    border: '1px solid var(--ok-border-alt)',
    color: 'var(--ok-text)'
  },
  amber: {
    background: 'var(--warn-bg)',
    border: '1px solid var(--warn-border)',
    color: 'var(--warn-text)'
  },
  danger: {
    background: 'var(--state-error-bg-soft)',
    border: '1px solid var(--state-error-border)',
    color: 'var(--state-error-text)'
  },
  dark: {
    background: 'var(--action-fill)',
    border: '1px solid transparent',
    color: 'var(--action-text)'
  }
};
function Badge({
  tone = 'neutral',
  mono = false,
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      height: 22,
      padding: '0 9px',
      borderRadius: 'var(--radius-pill)',
      fontFamily: mono ? 'var(--font-data)' : 'var(--font-label)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-tag)',
      whiteSpace: 'nowrap',
      ...BADGE_TONES[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Live portal buttons come in four registers:
   filled  — dark green fill, white text, pill ("Refer a Company →")
   outline — white fill, hairline border, ink text ("Ask AI", "Update Ratings")
   quiet   — no chrome, muted ink, used inside dense toolbars
   link    — teal inline text action ("View all →") */
const BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  fontFamily: 'var(--font-ui)',
  fontWeight: 'var(--fw-semibold)',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)'
};
const SIZES = {
  sm: {
    height: 30,
    padding: '0 12px',
    fontSize: 'var(--fs-xs)'
  },
  md: {
    height: 37,
    padding: '0 16px',
    fontSize: 'var(--fs-sm)'
  },
  lg: {
    height: 44,
    padding: '0 22px',
    fontSize: 'var(--fs-body)'
  }
};
const VARIANTS = {
  filled: {
    background: 'var(--action-fill)',
    color: 'var(--action-text)',
    border: '1px solid transparent'
  },
  outline: {
    background: 'var(--surface-card)',
    color: 'var(--text-strong)',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-xs)'
  },
  quiet: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid transparent'
  },
  link: {
    background: 'transparent',
    color: 'var(--text-link)',
    border: 'none',
    padding: 0,
    height: 'auto',
    fontWeight: 'var(--fw-medium)'
  }
};
function Button({
  variant = 'filled',
  size = 'md',
  pill = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  as = 'button',
  style,
  children,
  ...rest
}) {
  const Tag = as;
  const radius = variant === 'link' ? 0 : pill ? 'var(--radius-pill)' : 'var(--radius-md)';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    disabled: Tag === 'button' ? disabled : undefined,
    style: {
      ...BASE,
      ...SIZES[size],
      ...VARIANTS[variant],
      borderRadius: radius,
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : undefined,
      ...style
    }
  }, rest), iconLeft, /*#__PURE__*/React.createElement("span", null, children), iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The portal's one container: white, 12px radius, 1px #E0E4E0 hairline,
   whisper shadow. `inset` swaps to the paper fill used for quiet panels;
   `sheet` is the 16px-radius detail overlay. No coloured left borders. */
const FILLS = {
  card: {
    background: 'var(--surface-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)'
  },
  inset: {
    background: 'var(--surface-inset)',
    border: '1px solid var(--border-hairline)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'none'
  },
  sheet: {
    background: 'var(--surface-card)',
    border: '1px solid var(--border-hairline)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: 'var(--shadow-lg)'
  },
  ok: {
    background: 'var(--ok-bg)',
    border: '1px solid var(--ok-border)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'none'
  }
};
function Card({
  variant = 'card',
  pad = 20,
  as = 'div',
  style,
  children,
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      ...FILLS[variant],
      padding: pad,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Divider/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Hairline rule. Inside cards the live app uses #EFF1EE; between page regions
   it uses the stronger #E0E4E0. */
function Divider({
  tone = 'hairline',
  vertical = false,
  style,
  ...rest
}) {
  const color = tone === 'strong' ? 'var(--border-default)' : 'var(--border-hairline)';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "separator",
    style: vertical ? {
      width: 1,
      alignSelf: 'stretch',
      background: color,
      ...style
    } : {
      height: 1,
      width: '100%',
      background: color,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Divider/Divider.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Uppercase letterspaced micro-label: "DECARBON8" above a pipeline card,
   "APPLICATION" before the application chip, "FILTER" in a filter bar. */
function Eyebrow({
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-label)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Square chromeless glyph button — sheet close (×), collapse chevron,
   pagination arrows. 32px hit box in the live portal, which is under the
   44px minimum; flagged in readme.md. */
function IconButton({
  label,
  size = 32,
  tone = 'muted',
  style,
  children,
  ...rest
}) {
  const color = tone === 'strong' ? 'var(--text-strong)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    style: {
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      color,
      cursor: 'pointer',
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Sector / interest tag. Two live shapes: a bordered pill next to a company
   name ("AgTech & Food") and a flat paper chip in directory rows ("Software",
   "Carbon"). Tag text is muted, never coloured by sector. */
function Tag({
  shape = 'pill',
  style,
  children,
  ...rest
}) {
  const pill = shape === 'pill';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: pill ? 24 : 22,
      padding: pill ? '0 10px' : '0 8px',
      borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius-xs)',
      background: pill ? 'var(--paper-100)' : 'var(--paper-200)',
      border: pill ? '1px solid var(--line-200)' : '1px solid transparent',
      color: 'var(--text-muted)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-medium)',
      letterSpacing: 'var(--ls-tag)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/CountChip/CountChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Vertical activity-rail counter: a glyph plus a count in a tinted rounded
   chip. Zero counts stay grey; non-zero counts take their category tint. */
const CHIP_TONES = {
  ok: {
    background: 'var(--ok-bg)',
    border: '1px solid var(--ok-border)',
    color: 'var(--ok-text)'
  },
  warn: {
    background: '#FBF6E6',
    border: '1px solid #F0E0AE',
    color: '#8A6A1F'
  },
  teal: {
    background: 'var(--teal-wash)',
    border: '1px solid #D6E7E0',
    color: 'var(--teal-link)'
  },
  neutral: {
    background: 'var(--paper-100)',
    border: '1px solid var(--line-200)',
    color: 'var(--text-faint)'
  }
};
function CountChip({
  count = 0,
  tone = 'neutral',
  icon = null,
  label,
  style,
  ...rest
}) {
  const t = count > 0 ? CHIP_TONES[tone] : CHIP_TONES.neutral;
  return /*#__PURE__*/React.createElement("div", _extends({
    title: label,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      minWidth: 46,
      height: 26,
      padding: '0 7px',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      ...t,
      ...style
    }
  }, rest), icon, /*#__PURE__*/React.createElement("span", null, count));
}
Object.assign(__ds_scope, { CountChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/CountChip/CountChip.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Directory-style table: paper header strip with uppercase letterspaced column
   labels and a sort caret on the active column, hairline row rules, no zebra
   fill on white. Rows are supplied as rendered cells so callers can compose
   avatars, badge stacks and tag groups freely. */
function DataTable({
  columns = [],
  rows = [],
  totals,
  sortBy,
  sortDir = 'asc',
  onSort,
  style,
  ...rest
}) {
  const grid = columns.map(c => c.width || '1fr').join(' ');
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: grid,
      gap: 'var(--space-4)',
      padding: '14px 20px',
      background: 'var(--paper-100)',
      borderBottom: '1px solid var(--border-default)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    onClick: () => onSort && onSort(c.id),
    style: {
      appearance: 'none',
      background: 'none',
      border: 'none',
      padding: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      cursor: onSort ? 'pointer' : 'default',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-label)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--ink-850)',
      textAlign: c.align === 'right' ? 'right' : 'left',
      justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start'
    }
  }, c.label, sortBy === c.id && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: sortDir === 'asc' ? 'chevron-up' : 'chevron-down',
    size: 13,
    color: "var(--text-muted)"
  })))), rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: grid,
      gap: 'var(--space-4)',
      padding: '12px 20px',
      borderBottom: i === rows.length - 1 && !totals ? 'none' : '1px solid var(--border-hairline)',
      alignItems: 'start'
    }
  }, r.map((cell, j) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: j
  }, cell)))), totals ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: grid,
      gap: 'var(--space-4)',
      padding: '13px 20px',
      background: 'var(--paper-100)',
      borderTop: '1px solid var(--border-default)',
      fontWeight: 'var(--fw-title)',
      color: 'var(--text-strong)',
      alignItems: 'baseline'
    }
  }, totals.map((cell, j) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: j
  }, cell))) : null);
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/EmptyState/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Empty states in this product are one quiet plain sentence — no illustration,
   no encouragement. "No investments yet." / "There is no active E8 Fund
   candidate." */
function EmptyState({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    style: {
      margin: 0,
      padding: '10px 0',
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-muted)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/EmptyState/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/data/GroupHeader/GroupHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Date-range divider inside the long Portfolio News feed:
   "JULY - SEPTEMBER 2026" — uppercase, letterspaced, muted, with a rule. */
function GroupHeader({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      margin: '28px 0 14px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-label)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, children), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border-default)'
    }
  }));
}
Object.assign(__ds_scope, { GroupHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/GroupHeader/GroupHeader.jsx", error: String((e && e.message) || e) }); }

// components/data/RatingCell/RatingCell.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* One cell of the screening matrix. Score 0-4 maps onto a five-step
   red-to-green ramp sampled from the live app; a missing score renders a grey
   cell with an en dash. NOT IN THE BRAND GUIDELINES — see readme deviations.
   Live geometry: 29px tall, 6px radius, 4px row gap, 8px column gap. */
const RAMP = ['var(--rate-0)', 'var(--rate-1)', 'var(--rate-2)', 'var(--rate-3)', 'var(--rate-4)'];
function RatingCell({
  score = null,
  style,
  ...rest
}) {
  const has = score != null && score >= 0 && score <= 4;
  return /*#__PURE__*/React.createElement("div", _extends({
    title: has ? `Score ${score} of 4` : 'Not rated',
    style: {
      height: 'var(--rating-cell-h)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-sm)',
      background: has ? RAMP[score] : 'var(--rate-none)',
      color: has ? 'var(--ink-900)' : 'var(--text-faint)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      ...style
    }
  }, rest), has ? score : '–');
}
Object.assign(__ds_scope, { RatingCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/RatingCell/RatingCell.jsx", error: String((e && e.message) || e) }); }

// components/data/RatingMatrix/RatingMatrix.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Member x criterion screening grid — the densest surface in the portal.
   Names in a left column (semibold ink, 14px), criteria as centred column
   heads, one RatingCell per intersection. */
function RatingMatrix({
  criteria = [],
  rows = [],
  nameWidth = 200,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      overflowX: 'auto',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: nameWidth + criteria.length * 120
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `${nameWidth}px repeat(${criteria.length}, minmax(90px, 1fr))`,
      columnGap: 'var(--rating-gap-x)',
      alignItems: 'center',
      paddingBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null), criteria.map(c => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      textAlign: 'center',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ink-850)'
    }
  }, c))), rows.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.name,
    style: {
      display: 'grid',
      gridTemplateColumns: `${nameWidth}px repeat(${criteria.length}, minmax(90px, 1fr))`,
      columnGap: 'var(--rating-gap-x)',
      rowGap: 0,
      alignItems: 'center',
      marginBottom: 'var(--rating-gap-y)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ink-850)',
      paddingRight: 12
    }
  }, r.name), criteria.map((c, i) => /*#__PURE__*/React.createElement(__ds_scope.RatingCell, {
    key: c,
    score: r.scores[i]
  }))))));
}
Object.assign(__ds_scope, { RatingMatrix });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/RatingMatrix/RatingMatrix.jsx", error: String((e && e.message) || e) }); }

// components/data/SegmentedRating/SegmentedRating.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The rating INPUT — the segmented control inside the "Rate <Company>" dialog
   (sources/rate-company-modal.png). Five labelled cells in one bordered track,
   hairline dividers between them, the chosen cell filled from the same 0-4
   ramp RatingCell uses for the read-only grid.

   Unlike the grid, the fill here sits behind a WORD, so the colour is
   reinforced by the label and the ramp's accessibility problem is much
   smaller. Live geometry: 34px track, 6px radius, 1px --line-300 border,
   13.5px labels at weight 500 (600 when selected).

   The input's ramp is NOT the matrix ramp: sampling the capture gives fully
   saturated fills (#FFFF05 for Average, #81E400 for Good) where the matrix
   uses the same hues desaturated. Hence --rate-input-*.

   The ramp itself is a product invention with no brand-guideline equivalent —
   see readme.md § BRAND-GUIDELINE DEVIATIONS, row 9. */
const SEG_RAMP = ['var(--rate-input-0)', 'var(--rate-input-1)', 'var(--rate-input-2)', 'var(--rate-input-3)', 'var(--rate-input-4)'];
const SEGMENTED_SCALES = {
  quality: ['Dealbreaker', 'Weak', 'Average', 'Good', 'Strong'],
  recommendation: ['No Way', 'Probably Not', 'Maybe', 'Likely', 'Yes']
};
function SegmentedRating({
  labels,
  scale = 'quality',
  value = null,
  onChange,
  name,
  disabled = false,
  style,
  ...rest
}) {
  const cells = labels || SEGMENTED_SCALES[scale] || SEGMENTED_SCALES.quality;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "radiogroup",
    "aria-label": name,
    style: {
      display: 'inline-flex',
      border: '1px solid var(--line-300)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      background: 'var(--white)',
      opacity: disabled ? 'var(--state-disabled-opacity)' : 1,
      ...style
    }
  }, rest), cells.map((label, i) => {
    const on = value === i;
    return /*#__PURE__*/React.createElement("button", {
      key: label,
      type: "button",
      role: "radio",
      "aria-checked": on,
      disabled: disabled,
      onClick: () => !disabled && onChange && onChange(i),
      onMouseEnter: e => {
        if (!on && !disabled) e.currentTarget.style.background = 'var(--state-row-hover-bg)';
      },
      onMouseLeave: e => {
        if (!on) e.currentTarget.style.background = 'transparent';
      },
      style: {
        font: 'inherit',
        fontSize: 'var(--fs-data)',
        fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)',
        color: 'var(--ink-900)',
        padding: '8px 14px',
        minHeight: 34,
        border: 'none',
        borderLeft: i === 0 ? 'none' : '1px solid var(--line-300)',
        background: on ? SEG_RAMP[i] : 'transparent',
        cursor: disabled ? 'var(--state-disabled-cursor)' : 'pointer',
        transition: 'background var(--state-dur-fast) var(--state-ease)',
        whiteSpace: 'nowrap'
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { SEGMENTED_SCALES, SegmentedRating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/SegmentedRating/SegmentedRating.jsx", error: String((e && e.message) || e) }); }

// components/data/Skeleton/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The live portal fills not-yet-loaded cards with the literal word
   "Loading..." in muted body type. This component reproduces that, and offers
   a bar form for places where a shape placeholder is preferable. */
function Skeleton({
  variant = 'text',
  width = '100%',
  height = 14,
  style,
  ...rest
}) {
  if (variant === 'text') {
    return /*#__PURE__*/React.createElement("p", _extends({
      style: {
        margin: 0,
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-muted)',
        ...style
      }
    }, rest), "Loading...");
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width,
      height,
      borderRadius: 'var(--radius-xs)',
      background: 'var(--paper-200)',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Skeleton/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/data/StatTile/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The fund dashboard's headline metric (sources/e8-fund.png): an uppercase
   eyebrow, one large figure, one quiet sub-line. Six run across the top of the
   E8 Fund page in a three-up grid.

   The BALLOTS tile carries three figures in one tile instead of one, each with
   its own coloured caption, so `figures` takes an array. */
function StatTile({
  label,
  value,
  sub,
  figures,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xs)',
      padding: '16px 18px 15px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "e8-eyebrow",
    style: {
      marginBottom: 6
    }
  }, label), figures ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-6)'
    }
  }, figures.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.caption
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 'var(--fw-headline)',
      letterSpacing: 'var(--ls-tight)',
      color: 'var(--text-strong)',
      lineHeight: 1.1
    }
  }, f.value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-medium)',
      color: f.tone || 'var(--text-muted)',
      marginTop: 3
    }
  }, f.caption)))) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 'var(--fw-headline)',
      letterSpacing: 'var(--ls-tight)',
      color: 'var(--text-strong)',
      lineHeight: 1.15
    }
  }, value), sub ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-base)',
      color: 'var(--text-muted)',
      marginTop: 5
    }
  }, sub) : null);
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatTile/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Label + control + hint + error, in the referral form's right-aligned row
   layout (sources/refer-a-company-validation.png).

   ADDITION, NOT A RECREATION. The live form has no field-level error style at
   all: a required field that fails validation falls through to the browser's
   native validation bubble, which cannot be styled and disappears on the next
   keystroke. The error treatment here is built from the product's own
   .error-message colours (--state-error-*) so it lands inside the existing
   vocabulary. See readme.md § CONTROLS AND ELEMENTS THAT NEED ADDING. */
function Field({
  label,
  required = false,
  hint,
  error,
  layout = 'row',
  labelWidth = 170,
  htmlFor,
  children,
  style,
  ...rest
}) {
  const row = layout === 'row';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: row ? 'grid' : 'block',
      gridTemplateColumns: row ? labelWidth + 'px 1fr' : undefined,
      columnGap: 'var(--space-4)',
      alignItems: 'start',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontSize: 'var(--fs-reading)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-body)',
      textAlign: row ? 'right' : 'left',
      paddingTop: row ? 9 : 0,
      marginBottom: row ? 0 : 'var(--space-1)',
      display: 'block'
    }
  }, label, label ? ':' : null, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--state-error-text)',
      marginLeft: 4
    }
  }, "*") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-2)',
      minWidth: 0
    }
  }, children, hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-base)',
      fontStyle: 'italic',
      color: 'var(--text-muted)'
    }
  }, hint) : null, error ? /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      background: 'var(--state-error-bg-soft)',
      border: '1px solid var(--state-error-border)',
      color: 'var(--state-error-text)',
      borderRadius: 'var(--state-error-radius)',
      padding: '8px 12px',
      fontSize: 'var(--fs-base)',
      fontWeight: 'var(--fw-medium)'
    }
  }, error) : null));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Text field. Live: 37px tall, 10px radius, paper fill #F7F8F6, #C2CBC6
   border, faint placeholder. The white variant appears on the pale page
   ground (directory "Filter members..."). */
function Input({
  tone = 'paper',
  iconLeft = null,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      height: 'var(--control-h)',
      padding: '0 12px',
      background: tone === 'white' ? 'var(--white)' : 'var(--paper-100)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      color: 'var(--text-body)',
      ...style
    }
  }, iconLeft, /*#__PURE__*/React.createElement("input", _extends({
    style: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'inherit',
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-strong)'
    }
  }, rest)));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchInput/SearchInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The header search. Live width ~264px, magnifier glyph left, faint
   "Search..." placeholder. */
function SearchInput({
  placeholder = 'Search...',
  width = 264,
  tone = 'paper',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Input, _extends({
    tone: tone,
    placeholder: placeholder,
    iconLeft: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "search",
      size: 15,
      color: "var(--text-faint)"
    }),
    style: {
      width,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { SearchInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchInput/SearchInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/SelectControl/SelectControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Split filter select from the Portfolio News toolbar: a white label cell and
   a chevron cell, divided by a hairline, inside one rounded outline. */
function SelectControl({
  value,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    style: {
      display: 'inline-flex',
      alignItems: 'stretch',
      height: 'var(--control-h)',
      background: 'var(--white)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-xs)',
      overflow: 'hidden',
      cursor: 'pointer',
      padding: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0 14px',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-strong)'
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0 9px',
      borderLeft: '1px solid var(--border-default)',
      color: 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 15
  })));
}
Object.assign(__ds_scope, { SelectControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SelectControl/SelectControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/StageTabs/StageTabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Pipeline stage selector. Same underline mechanic as UnderlineTabs but each
   stage carries a count set beside the label in a lighter weight, and stages
   with no companies still show — the portal never hides a stage. */
function StageTabs({
  stages = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-8)',
      borderBottom: '1px solid var(--border-hairline)',
      ...style
    }
  }, rest), stages.map(s => {
    const active = s.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange && onChange(s.id),
      style: {
        appearance: 'none',
        background: 'none',
        border: 'none',
        padding: '0 0 9px',
        marginBottom: -1,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        fontSize: 'var(--fs-body)',
        fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-medium)',
        color: active ? 'var(--text-strong)' : 'var(--text-faint)',
        borderBottom: active ? '2px solid var(--ink-900)' : '2px solid transparent'
      }
    }, /*#__PURE__*/React.createElement("span", null, s.label), s.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-xs)',
        fontWeight: 'var(--fw-regular)',
        color: active ? 'var(--text-muted)' : 'var(--text-faint)'
      }
    }, s.count));
  }));
}
Object.assign(__ds_scope, { StageTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/StageTabs/StageTabs.jsx", error: String((e && e.message) || e) }); }

// components/forms/Toggle/Toggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The "Hide Fails" switch in the fund dashboard's Ballot results header: a
   dark filled pill with the label inside it and a white knob on the leading
   edge. Reads as one object rather than a switch plus a separate label. */
function Toggle({
  checked = false,
  onChange,
  label,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 26,
      padding: '0 12px 0 3px',
      border: '1px solid transparent',
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--action-fill)' : 'var(--paper-200)',
      color: checked ? 'var(--action-text)' : 'var(--text-muted)',
      fontFamily: 'var(--font-label)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-tag)',
      cursor: disabled ? 'var(--state-disabled-cursor)' : 'pointer',
      opacity: disabled ? 'var(--state-disabled-opacity)' : 1,
      transition: 'background var(--state-dur-fast) var(--state-ease)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-circle)',
      background: 'var(--white)',
      boxShadow: 'var(--shadow-xs)'
    }
  }), label);
}
Object.assign(__ds_scope, { Toggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Toggle/Toggle.jsx", error: String((e && e.message) || e) }); }

// components/forms/UnderlineTabs/UnderlineTabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Underline tab row. Live: active = ink, semibold, 2px ink underline;
   inactive = #96A09B regular. Used for the detail sheet
   (Overview / Screening & ratings / AI Insights / Messages / Documents). */
function UnderlineTabs({
  tabs = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-6)',
      borderBottom: '1px solid var(--border-hairline)',
      ...style
    }
  }, rest), tabs.map(t => {
    const id = typeof t === 'string' ? t : t.id;
    const label = typeof t === 'string' ? t : t.label;
    const active = id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange && onChange(id),
      style: {
        appearance: 'none',
        background: 'none',
        border: 'none',
        padding: '0 0 10px',
        marginBottom: -1,
        cursor: 'pointer',
        fontSize: 'var(--fs-body)',
        fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-regular)',
        color: active ? 'var(--text-strong)' : 'var(--text-faint)',
        borderBottom: active ? '2px solid var(--ink-900)' : '2px solid transparent'
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { UnderlineTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/UnderlineTabs/UnderlineTabs.jsx", error: String((e && e.message) || e) }); }

// components/media/Icon/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* SUBSTITUTED ICON SET — see readme.md § ICONOGRAPHY.
   The live portal ships a thin-stroke outline set (home, git-branch, users,
   link-2, search, chevron-down, mail, map-pin, sparkles, calendar, play,
   filter, message-square, x, clock, file-text, square-check, arrow-right,
   chevron-up). No icon files were supplied, so this wrapper renders Lucide,
   whose 1.5-2px rounded-join outlines are the closest public match.

   Lucide is loaded from CDN by the host page:
     <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
   This component asks Lucide to hydrate its own node after mount. If Lucide is
   absent it renders an empty inline box, never a hand-drawn shape. */
function Icon({
  name,
  size = 16,
  stroke = 1.75,
  color = 'currentColor',
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const host = ref.current;
    if (!host || !window.lucide) return;
    host.innerHTML = '';
    const i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    host.appendChild(i);
    try {
      window.lucide.createIcons({
        nameAttr: 'data-lucide',
        attrs: {
          width: size,
          height: size,
          'stroke-width': stroke
        },
        nodes: [i]
      });
    } catch (e) {
      window.lucide.createIcons();
    }
  }, [name, size, stroke]);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    "aria-hidden": "true",
    style: {
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color,
      flex: '0 0 auto',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/Icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/media/Wordmark/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The supplied brand asset is the globe + "E8" lockup (assets/logo.svg), a
   monochrome currentColor mark. It is fetched and inlined so it inherits
   `color` and can be tinted (forest ink on light, white on dark). CSS masking
   was tried first and proved unreliable across engines for this file.

   NOTE: the file as supplied carried fill="none" on its root, which rendered
   nothing; assets/logo.svg in this project has fill="currentColor" restored.

   The live portal header shows a globe-only mark beside the words
   "E8 Angels / Member Portal"; no globe-only file was supplied, so this
   renders the lockup it was given. See readme.md § CAVEATS. */
const SVG_CACHE = {};
function Wordmark({
  src = 'assets/logo.svg',
  height = 34,
  color = 'var(--text-strong)',
  style,
  ...rest
}) {
  const [markup, setMarkup] = React.useState(SVG_CACHE[src] || null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    if (SVG_CACHE[src]) {
      setMarkup(SVG_CACHE[src]);
      return;
    }
    let live = true;
    fetch(src).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => {
      const cleaned = t.replace(/<\?xml[^>]*\?>/g, '').replace(/<svg /, '<svg style="width:100%;height:100%;display:block" ');
      SVG_CACHE[src] = cleaned;
      if (live) setMarkup(cleaned);
    }).catch(() => {
      if (live) setFailed(true);
    });
    return () => {
      live = false;
    };
  }, [src]);
  const box = {
    display: 'inline-block',
    height,
    width: height * (1115 / 612),
    color,
    flex: '0 0 auto',
    ...style
  };

  /* Fallback for contexts where the SVG cannot be fetched and inlined
     (file://, restricted sandboxes): render it as an image. The mark is
     currentColor, so an <img> paints it black — correct on light grounds,
     inverted for dark ones. */
  if (failed) {
    return /*#__PURE__*/React.createElement("img", _extends({
      src: src,
      alt: "E8 Angels",
      style: {
        ...box,
        objectFit: 'contain',
        filter: color === 'var(--white)' || color === '#fff' || color === '#ffffff' ? 'invert(1)' : 'none'
      }
    }, rest));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": "E8 Angels",
    style: box,
    dangerouslySetInnerHTML: markup ? {
      __html: markup
    } : undefined
  }, rest));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/Wordmark/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/portal/ActivityRail/ActivityRail.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Vertical counter rail pinned to the right edge of the company sheet: a
   column of CountChips, a rotated "Activity" label, and a collapse chevron. */
function ActivityRail({
  chips = [],
  label = 'Activity',
  onCollapse,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("aside", _extends({
    style: {
      width: 56,
      display: 'grid',
      justifyItems: 'center',
      alignContent: 'start',
      gap: 8,
      padding: '14px 0',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-xl)',
      ...style
    }
  }, rest), chips.map((c, i) => /*#__PURE__*/React.createElement(__ds_scope.CountChip, _extends({
    key: i
  }, c))), /*#__PURE__*/React.createElement("span", {
    style: {
      writingMode: 'vertical-rl',
      marginTop: 10,
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    label: "Collapse activity",
    onClick: onCollapse
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-left",
    size: 16
  })));
}
Object.assign(__ds_scope, { ActivityRail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/ActivityRail/ActivityRail.jsx", error: String((e && e.message) || e) }); }

// components/portal/ChatFab/ChatFab.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Floating support button, bottom-right: 56px dark ink circle, white bubble
   glyph, one step more shadow than a card so it reads as floating. */
function ChatFab({
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": "Open chat",
    onClick: onClick,
    style: {
      position: 'fixed',
      right: 24,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: '50%',
      border: 'none',
      background: 'var(--surface-inverse)',
      color: 'var(--white)',
      boxShadow: 'var(--shadow-md)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 50,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "message-square",
    size: 22,
    color: "var(--white)"
  }));
}
Object.assign(__ds_scope, { ChatFab });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/ChatFab/ChatFab.jsx", error: String((e && e.message) || e) }); }

// components/portal/CompanyCard/CompanyCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Pipeline tile. The programme eyebrow ("DECARBON8") sits OUTSIDE the card,
   above its top-right corner. Inside: 48px logo tile + name, then a clamped
   three-line description, a hairline, an overlapped avatar stack, and the team
   written out in full with "(Lead)" appended to leads. Cards tile ~3 across
   and wrap; they never scroll horizontally.

   gridTemplateRows 'auto 1fr' matters: the enclosing pipeline grid stretches
   each tile to the tallest sibling, and with two implicit auto rows the
   leftover height gets split between the eyebrow and the card, so card tops
   drift out of alignment row to row. Pinning the second row to 1fr sends all
   extra height to the card. */
function CompanyCard({
  name,
  logo,
  initials,
  description,
  programme,
  team = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      gap: 4,
      ...style
    }
  }, rest), programme && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      paddingRight: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Eyebrow, null, programme)), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    pad: 20,
    style: {
      display: 'grid',
      gap: 14,
      alignContent: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    shape: "tile",
    size: 48,
    src: logo,
    initials: initials,
    name: name,
    style: {
      border: '1px solid var(--border-hairline)'
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--fs-h3)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-tight)'
    }
  }, name)), description && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-body)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--ink-700)',
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, description), team.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Divider, null), /*#__PURE__*/React.createElement(__ds_scope.AvatarStack, {
    people: team,
    size: 26,
    max: 7
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-sm)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text-muted)'
    }
  }, team.map((m, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && ', ', m.name, m.lead ? ' (Lead)' : ''))))));
}
Object.assign(__ds_scope, { CompanyCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/CompanyCard/CompanyCard.jsx", error: String((e && e.message) || e) }); }

// components/portal/ConfirmationSummary/ConfirmationSummary.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The "Referral Submitted" panel (sources/referral-submitted.png): an inset
   card of label/value rows, each on a hairline, values right-aligned and
   optionally a link. Used to read a submission back to the member before they
   act on it.

   Live geometry, measured off the capture at 2x: paper fill #F7F8F6, 1px
   #DFE4E0 border, 10px radius, 24px side padding, 46.5px row pitch, label 600
   / value 400 at 15px. Two corrections from the sample: the rule runs under
   the LAST row too (the card ends 22px below it), and the label is the
   secondary ink #2F3D39 while the VALUE carries #14201E — the reverse of the
   usual label/value weighting. Rules are --line-200, the same colour as the
   card border, not a lighter hairline. */
function ConfirmationSummary({
  rows = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--paper-100)',
      border: '1px solid var(--line-200)',
      borderRadius: 'var(--radius-lg)',
      padding: '10px 24px 22px',
      ...style
    }
  }, rest), rows.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.label,
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      padding: '13px 0',
      borderBottom: '1px solid var(--line-200)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-reading)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ink-750)'
    }
  }, r.label, ":"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-reading)',
      color: 'var(--ink-900)',
      textAlign: 'right'
    }
  }, r.href ? /*#__PURE__*/React.createElement("a", {
    href: r.href,
    style: {
      color: 'var(--teal-link-alt)',
      textDecoration: 'none'
    }
  }, r.value) : r.value))));
}
Object.assign(__ds_scope, { ConfirmationSummary });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/ConfirmationSummary/ConfirmationSummary.jsx", error: String((e && e.message) || e) }); }

// components/portal/CtaBanner/CtaBanner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Pale-green referral panel in the left rail: a centred question and one
   filled pill button. This is the only place the portal raises its voice. */
function CtaBanner({
  question,
  cta,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    variant: "ok",
    pad: 20,
    style: {
      display: 'grid',
      justifyItems: 'center',
      gap: 14,
      textAlign: 'center',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--ink-900)'
    }
  }, question), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "filled",
    size: "sm",
    pill: true,
    onClick: onClick,
    iconRight: "\u2192"
  }, cta));
}
Object.assign(__ds_scope, { CtaBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/CtaBanner/CtaBanner.jsx", error: String((e && e.message) || e) }); }

// components/portal/DetailSheet/DetailSheet.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The company record opens as a large centred overlay sheet: 16px radius,
   heavy soft shadow, close × top-right, scrolling body, page dimmed behind.
   Long content still expands inline inside it — the sheet is a container, not
   a substitute for in-place disclosure. */
function DetailSheet({
  open = true,
  onClose,
  width = 1480,
  children,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--scrim)',
      display: 'flex',
      justifyContent: 'center',
      padding: '16px 0 0',
      zIndex: 40
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", _extends({
    onClick: e => e.stopPropagation(),
    style: {
      position: 'relative',
      width: 'min(' + width + 'px, calc(100% - 32px))',
      maxHeight: 'calc(100% - 16px)',
      overflow: 'auto',
      background: 'var(--surface-card)',
      borderTopLeftRadius: 'var(--radius-2xl)',
      borderTopRightRadius: 'var(--radius-2xl)',
      boxShadow: 'var(--shadow-lg)',
      padding: '22px 24px 32px',
      ...style
    }
  }, rest), children));
}
Object.assign(__ds_scope, { DetailSheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/DetailSheet/DetailSheet.jsx", error: String((e && e.message) || e) }); }

// components/portal/EventItem/EventItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Calendar row. The month sits in a narrow left gutter and repeats only when
   it changes; a year suffix appears when the year rolls over ("Jan '27").
   Title is ink semibold, the datetime line is muted 13px with a timezone. */
function EventItem({
  month,
  title,
  when,
  attending = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      gridTemplateColumns: '38px 1fr',
      gap: 'var(--space-3)',
      padding: '10px 0',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-muted)',
      lineHeight: 1.35,
      whiteSpace: 'pre-line'
    }
  }, month), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ink-900)',
      lineHeight: 'var(--lh-snug)'
    }
  }, title), attending && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "ok"
  }, "Attending")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-muted)'
    }
  }, when)));
}
Object.assign(__ds_scope, { EventItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/EventItem/EventItem.jsx", error: String((e && e.message) || e) }); }

// components/portal/MemberRow/MemberRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Directory name cell: 32px avatar, name in ink semibold with membership-class
   badges inline, and a muted "Member since …" line beneath. */
function MemberRow({
  name,
  src,
  badges = [],
  since,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: src,
    size: 32,
    style: {
      border: '1px solid var(--border-hairline)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ink-850)'
    }
  }, name), badges.map(b => /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    key: b,
    tone: "neutral"
  }, b))), since && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-2xs)',
      color: 'var(--text-faint)'
    }
  }, since)));
}
Object.assign(__ds_scope, { MemberRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/MemberRow/MemberRow.jsx", error: String((e && e.message) || e) }); }

// components/portal/NewsRow/NewsRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Newsletter / news list row: abbreviated US date in a fixed left column,
   headline, trailing arrow. The newest row is highlighted with the paper fill
   and a "Latest" marker. */
function NewsRow({
  date,
  title,
  latest = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("a", _extends({
    href: "#",
    style: {
      display: 'grid',
      gridTemplateColumns: '92px 1fr 18px',
      gap: 'var(--space-3)',
      alignItems: 'start',
      padding: '11px 12px',
      borderRadius: 'var(--radius-md)',
      background: latest ? 'var(--paper-100)' : 'transparent',
      borderTop: '1px solid var(--border-hairline)',
      color: 'inherit',
      textDecoration: 'none',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-muted)',
      paddingTop: 1
    }
  }, date), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      gap: 3
    }
  }, latest && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-label)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-link)'
    }
  }, "Latest"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ink-900)',
      lineHeight: 'var(--lh-snug)'
    }
  }, title)), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: 15,
    color: "var(--text-faint)",
    style: {
      marginTop: 2
    }
  }));
}
Object.assign(__ds_scope, { NewsRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/NewsRow/NewsRow.jsx", error: String((e && e.message) || e) }); }

// components/portal/SectionCard/SectionCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Card + header row — the dashboard's repeating unit. */
function SectionCard({
  title,
  action,
  onAction,
  pad = 20,
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    pad: pad,
    style: style
  }, rest), (title || action) && /*#__PURE__*/React.createElement(__ds_scope.SectionHeader, {
    title: title,
    action: action,
    onAction: onAction
  }), children);
}
Object.assign(__ds_scope, { SectionCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/SectionCard/SectionCard.jsx", error: String((e && e.message) || e) }); }

// components/portal/SectionHeader/SectionHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Card header row: title left, one text action right ("View all →",
   "All issues →", "Browse full directory →"). The action is teal, 14px,
   and always ends in an arrow. */
function SectionHeader({
  title,
  action,
  onAction,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--fs-h2)',
      fontWeight: 'var(--fw-title)',
      letterSpacing: 'var(--ls-tight)'
    }
  }, title), action && /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      appearance: 'none',
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-link)'
    }
  }, action));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/SectionHeader/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/portal/SlackStrip/SlackStrip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Full-width Slack activity ticker directly under the header: white ground,
   a small "E8 SLACK" label, then author + truncated message pairs separated by
   faint dot bullets. DEVIATION: this strip is plain white in the live app; the
   brand-derived system called for the teal-to-forest gradient here. */
function SlackStrip({
  messages = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      height: 'var(--slack-strip-h)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: '0 20px',
      background: 'var(--white)',
      borderBottom: '1px solid var(--border-default)',
      overflow: 'hidden',
      fontSize: 'var(--fs-xs)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      flex: '0 0 auto',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-label)',
      letterSpacing: 'var(--ls-label)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: 3,
      background: 'linear-gradient(135deg,#36C5F0,#2EB67D 45%,#ECB22E 70%,#E01E5A)'
    }
  }), "E8 SLACK"), messages.map((m, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: 'var(--line-300)',
      flex: '0 0 auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      minWidth: 0,
      flex: '0 1 auto'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: m.author,
    src: m.avatar,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-muted)',
      flex: '0 0 auto'
    }
  }, m.author), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-700)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, m.text)))));
}
Object.assign(__ds_scope, { SlackStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/SlackStrip/SlackStrip.jsx", error: String((e && e.message) || e) }); }

// components/portal/TopNav/TopNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Fixed 69px white header, hairline base.
   Left: mark + "E8 Angels" / "Member Portal" two-line lockup.
   Middle: nav items. The selected item is a 42px, 8px-radius pill filled
   #0F5049 with white text; the rest are plain ink with a leading glyph and,
   where they open a menu, a trailing chevron.
   Right: 264px search, then the account avatar with a chevron. */
function TopNav({
  items = [],
  active,
  onSelect,
  logoSrc = 'assets/logo.svg',
  onSearch,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      height: 'var(--header-h)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)',
      padding: '0 20px',
      background: 'var(--white)',
      borderBottom: '1px solid var(--border-default)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    src: logoSrc,
    height: 30,
    color: "var(--ink-900)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      lineHeight: 1.2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-h3)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--ink-900)'
    }
  }, "E8 Angels"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-xs)',
      letterSpacing: '0.03em',
      color: 'var(--text-muted)'
    }
  }, "Member Portal"))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onSelect && onSelect(it.id),
      style: {
        height: 'var(--nav-pill-h)',
        padding: '0 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 'var(--radius-md)',
        border: 'none',
        cursor: 'pointer',
        background: on ? 'var(--nav-active-fill)' : 'transparent',
        color: on ? 'var(--nav-active-text)' : 'var(--ink-700)',
        fontSize: 'var(--fs-body)',
        fontWeight: 'var(--fw-medium)'
      }
    }, it.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 16
    }), /*#__PURE__*/React.createElement("span", null, it.label), it.menu && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-down",
      size: 15,
      color: on ? 'var(--white)' : 'var(--text-faint)'
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.SearchInput, {
    onChange: onSearch
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      height: 'var(--control-h)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '0 8px 0 6px',
      background: 'var(--white)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-user-round",
    size: 22,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 15,
    color: "var(--text-faint)"
  })));
}
Object.assign(__ds_scope, { TopNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/portal/TopNav/TopNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/App.jsx
try { (() => {
let Button, Card, Badge, Tag, Avatar, AvatarStack, Input, SearchInput, Tabs, Wordmark, Icon, ProfileCard, SectionCard, CompanyCard, NewsItem, EventItem, CtaBanner, D;
function bindNS() {
  const NS = window.E8AngelsDesignSystem_ed2725 || {};
  ({
    Button,
    Card,
    Badge,
    Tag,
    Avatar,
    AvatarStack,
    Input,
    SearchInput,
    Tabs,
    Wordmark,
    Icon,
    ProfileCard,
    SectionCard,
    CompanyCard,
    NewsItem,
    EventItem,
    CtaBanner
  } = NS);
  D = window.E8_DATA;
}
bindNS();

/* ---------- Header ---------- */
function Header() {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: "var(--header-h)",
      background: "var(--white)",
      borderBottom: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 22
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "18px",
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 20
  }), /*#__PURE__*/React.createElement(Avatar, {
    name: D.user.name,
    size: 30
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-strong)",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "menu",
    size: 24
  }))));
}

/* ---------- Slack activity strip ---------- */
function SlackStrip() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--brand-gradient)",
      display: "flex",
      alignItems: "center",
      gap: "18px",
      padding: "10px 24px",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      flex: "none",
      color: "#fff",
      fontWeight: "var(--fw-bold)",
      fontSize: "12px",
      letterSpacing: "var(--ls-tag)",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "message-square",
    size: 16,
    color: "#fff"
  }), " E8 Slack"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "26px",
      overflow: "hidden",
      flex: 1
    }
  }, D.slack.map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      flex: "none",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m.author,
    size: 22,
    ring: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: "13px",
      fontWeight: "var(--fw-semibold)"
    }
  }, m.author), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,.85)",
      fontSize: "13px",
      maxWidth: "260px",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, m.text)))));
}

/* ---------- Meeting recordings card ---------- */
function RecordingsCard() {
  const [tab, setTab] = React.useState("mm");
  return /*#__PURE__*/React.createElement(SectionCard, {
    title: "Meeting Recordings",
    action: "View all"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      id: "mm",
      label: "Member Meetings"
    }, {
      id: "ll",
      label: "Learning Labs"
    }, {
      id: "db",
      label: "Debriefs"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      aspectRatio: "16/9",
      background: "linear-gradient(135deg,#eef2f7,#e2e8f0)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: "rgba(15,23,42,.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(2px)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 22,
    color: "#fff"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h3)",
      color: "var(--text-strong)"
    }
  }, "Member Meeting: May 2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-muted)",
      marginTop: 2
    }
  }, "Ocean Build, Alithic, Without, E-Zinc, Fu\u2026"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 14
  }), " Watch \u2192")));
}

/* ---------- Member directory card ---------- */
function DirectoryCard() {
  const [q, setQ] = React.useState("");
  const shown = D.directory.filter(n => n.toLowerCase().includes(q.toLowerCase())).slice(0, 7);
  return /*#__PURE__*/React.createElement(SectionCard, {
    title: "Member Directory"
  }, /*#__PURE__*/React.createElement(SearchInput, {
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(AvatarStack, {
    people: shown.map(n => ({
      name: n
    })),
    size: 34,
    max: 7,
    overlap: 9
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-muted)"
    }
  }, "199 members"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)"
    }
  }, "Browse full directory \u2192")));
}

/* ---------- Refer modal ---------- */
function ReferModal({
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,.45)",
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 440
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "24px",
    elevation: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: "var(--fs-h1)"
    }
  }, "Refer a Company"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-muted)",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 20
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      marginBottom: 18
    }
  }, "Know a great climate startup? Send it our way and the diligence team will take a look."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "e8-eyebrow",
    style: {
      marginBottom: 6
    }
  }, "Company name"), /*#__PURE__*/React.createElement(Input, {
    placeholder: "e.g. NALA Membranes"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "e8-eyebrow",
    style: {
      marginBottom: 6
    }
  }, "Website"), /*#__PURE__*/React.createElement(Input, {
    placeholder: "https://"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onClose
  }, "Submit referral"))))));
}

/* ---------- App ---------- */
function App() {
  bindNS();
  const [refer, setRefer] = React.useState(false);
  const [events, setEvents] = React.useState(D.events);
  const toggleRsvp = i => setEvents(ev => ev.map((e, j) => j === i ? {
    ...e,
    attending: !e.attending
  } : e));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement(Header, null), /*#__PURE__*/React.createElement(SlackStrip, null), /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "24px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "20px",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "20px"
    }
  }, /*#__PURE__*/React.createElement(ProfileCard, {
    name: D.user.name,
    email: D.user.email,
    memberSince: D.user.memberSince,
    sectionLabel: "Recent Investments",
    footerLink: "View all investments"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-muted)",
      margin: 0
    }
  }, "No investments yet.")), /*#__PURE__*/React.createElement(SectionCard, {
    title: "E8 Calendar",
    action: "View All"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, events.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => toggleRsvp(i),
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(EventItem, {
    dateLine: e.dateLine,
    title: e.title,
    attending: e.attending
  }))))), /*#__PURE__*/React.createElement(RecordingsCard, null), /*#__PURE__*/React.createElement(DirectoryCard, null), /*#__PURE__*/React.createElement(CtaBanner, {
    heading: "Know a great climate startup?",
    buttonLabel: "Refer a Company",
    onClick: () => setRefer(true)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "2px 2px 4px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "var(--success)"
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: "var(--fs-h2)"
    }
  }, "Diligence"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-faint)"
    }
  }, D.diligence.length)), D.diligence.map((c, i) => /*#__PURE__*/React.createElement(CompanyCard, {
    key: i,
    name: c.name,
    description: c.description,
    team: c.team,
    leadName: c.leadName,
    tag: c.tag,
    onClick: () => {}
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "20px"
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      marginBottom: 10
    }
  }, "There is no active E8 Fund candidate."), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)"
    }
  }, "View E8 Fund results \u2192")), /*#__PURE__*/React.createElement(SectionCard, {
    title: "Portfolio News",
    action: "All portfolio news"
  }, /*#__PURE__*/React.createElement("div", null, D.news.map((n, i) => /*#__PURE__*/React.createElement(NewsItem, {
    key: i,
    company: n.company,
    date: n.date,
    divider: i !== 0
  }, n.body.map((seg, j) => j % 2 === 1 ? /*#__PURE__*/React.createElement("strong", {
    key: j
  }, seg) : seg)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-muted)"
    }
  }, "Show 107 more"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)"
    }
  }, "All portfolio news \u2192"))), /*#__PURE__*/React.createElement(SectionCard, {
    title: "What's New at E8"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, D.posts.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderTop: i ? "1px solid var(--border-hairline)" : "none",
      paddingTop: i ? 16 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.author,
    size: 28
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)"
    }
  }, p.author), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-faint)"
    }
  }, p.date))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      marginBottom: 8
    }
  }, p.body), p.tagLabel && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--text-strong)"
    }
  }, p.tagLabel, ":"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--brand-soft)",
      color: "var(--e8-teal-700)",
      padding: "1px 4px",
      borderRadius: 4
    }
  }, p.tagText)), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-block",
      marginTop: 8,
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)"
    }
  }, "Continue reading \u2192"))))))), /*#__PURE__*/React.createElement("button", {
    style: {
      position: "fixed",
      right: 24,
      bottom: 24,
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: "var(--slate-900)",
      border: "none",
      cursor: "pointer",
      color: "#fff",
      boxShadow: "var(--shadow-lg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "message-circle",
    size: 24,
    color: "#fff"
  })), refer && /*#__PURE__*/React.createElement(ReferModal, {
    onClose: () => setRefer(false)
  }));
}
window.PortalApp = App;
const rootEl = document.getElementById("root");
if (rootEl) ReactDOM.createRoot(rootEl).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/data.js
try { (() => {
// Sample content for the E8 portal Home recreation — drawn from the source PDF.
window.E8_DATA = {
  user: {
    name: "Nami Turner",
    email: "nami@nagog.com",
    memberSince: "June 2026"
  },
  slack: [{
    author: "Sarah Bell",
    text: "Latest from the post-fire cleanup of grid-scale lithium storage…"
  }, {
    author: "Arul Menezes",
    text: "On Tuesday we ran an event at Seattle Tech Week called Investing in…"
  }, {
    author: "Marina Psaros",
    text: "Sharing the deck from yesterday's Learning Lab — great turnout."
  }],
  events: [{
    dateLine: "WED, SEP 2 · 10:00 AM PT",
    title: "Put Your DAF to Work: Investing Philanthropic Capital in Climate (E8 Learning Lab)",
    attending: true
  }, {
    dateLine: "THU, SEP 24 · 10:00 AM PT",
    title: "E8 Member Meeting"
  }, {
    dateLine: "THU, OCT 22 · 10:00 AM PT",
    title: "E8 Member Meeting"
  }, {
    dateLine: "THU, NOV 19 · 10:00 AM PT",
    title: "E8 Member Meeting"
  }, {
    dateLine: "THU, JAN 28 · 10:00 AM PT",
    title: "E8 Member Meeting"
  }],
  diligence: [{
    name: "NALA Membranes",
    description: "NALA is commercializing the first new membranes in 40 yrs to reduce the cost and climate impact of advanced water treatment.",
    leadName: "Arielle Cohen",
    tag: "DECARBON8",
    team: [{
      name: "Arielle Cohen"
    }, {
      name: "Jeff Canin"
    }, {
      name: "Kathryn Gardow"
    }, {
      name: "Steven Gold"
    }, {
      name: "Susan Wall"
    }, {
      name: "Paulina Echeverria"
    }]
  }, {
    name: "PhytoGenesis",
    description: "A scalable biological platform that activates natural plant immunity to deliver season-long disease protection, climate resilience, higher yields, and lower production costs.",
    leadName: "Arielle Cohen",
    tag: "DECARBON8",
    team: [{
      name: "Arielle Cohen"
    }, {
      name: "Alejandro Rincon"
    }, {
      name: "Aloke Gupta"
    }, {
      name: "Ashwin Moodithaya"
    }, {
      name: "David Benham"
    }, {
      name: "Ramalee Wulf"
    }, {
      name: "Rebecca Stafford"
    }, {
      name: "Stephanie Simon"
    }]
  }, {
    name: "Raya Power",
    description: "A solar + storage system that installs in a backyard in 3 hours, no permits, provides automatic backup power and scalable bill savings, and pays for itself from day one.",
    leadName: "Ben Packard",
    tag: "DECARBON8",
    team: [{
      name: "Ben Packard"
    }, {
      name: "Adam Robinson"
    }, {
      name: "Brady Montz"
    }, {
      name: "Frances Merenda"
    }, {
      name: "Tucker Andrews"
    }]
  }, {
    name: "Root Applied Sciences",
    description: "We provide farmers with regular information on airborne pathogens while they are still in the air, before they land on crops and cause disease.",
    leadName: "Courtney Blodgett",
    tag: "DECARBON8",
    team: [{
      name: "Courtney Blodgett"
    }, {
      name: "David Benham"
    }, {
      name: "Jane Franch"
    }, {
      name: "Judith Walsh"
    }, {
      name: "Marly Levene"
    }, {
      name: "Rosemary Dunkle"
    }]
  }, {
    name: "Andros Innovations Inc.",
    description: "Developing a chemical-looping ammonia reactor that uses atmospheric pressure and moderate temperature to enable lower-cost, distributed ammonia plants.",
    leadName: "Andrew Reiter",
    tag: "DECARBON8",
    team: [{
      name: "Andrew Reiter"
    }, {
      name: "Kathleen Hebert"
    }, {
      name: "Kaya Pungello"
    }, {
      name: "Larry Aller"
    }, {
      name: "Seth Snyder"
    }]
  }, {
    name: "Harmony Desalting",
    description: "Advanced desalting for superior performance.",
    leadName: "Michelle Yeh",
    tag: "DECARBON8",
    team: [{
      name: "Michelle Yeh"
    }, {
      name: "Mikell Warms"
    }, {
      name: "Erika Smith"
    }, {
      name: "Jeff Canin"
    }, {
      name: "Larry Aller"
    }, {
      name: "Sarah Chong"
    }]
  }],
  news: [{
    company: "Quantum Energy",
    date: "Jul 20, 2026",
    body: ["Quantum Energy added two large clean-energy developer customers, ", "Repsol and AES", ". The company also advanced a major ISO interconnection milestone."]
  }, {
    company: "NxLite",
    date: "Jul 19, 2026",
    body: ["NxLite closed a ", "$13.1 million Series A", ", above its original target, and added a $3.5 million debt facility from RSF Social Finance to support scale-up."]
  }, {
    company: "UbiQD",
    date: "Jul 19, 2026",
    body: ["UbiQD received a ", "$200,000 award", " through New Mexico's Quantum Technologies Award, supporting the company's continued expansion."]
  }, {
    company: "Solidec",
    date: "Jul 15, 2026",
    body: ["Solidec grew its pipeline from ", "4 to 7 LOIs", " as reported in the July quarterly update and added 4 new pilots in negotiation, all in food and beverage."]
  }, {
    company: "Power to Hydrogen",
    date: "Jul 14, 2026",
    body: ["Power to Hydrogen is now deploying commercial AEM electrolyzer systems globally, including a ", "second commercial sale", " to a European partner."]
  }],
  directory: ["Nami Turner", "Kathryn Gardow", "Arielle Cohen", "Ben Packard", "Jeff Canin", "Marina Psaros", "Courtney Blodgett"],
  posts: [{
    author: "Amanda White",
    date: "May 5, 2026",
    title: "Member Meeting: May 2026 recap",
    body: "Our April Member Meeting was a hit with all 5 companies moving to Follow-Up Calls!",
    tagLabel: "New Companies",
    tagText: "Aslan Renewables, itselectric, NALA"
  }, {
    author: "Amanda White",
    date: "Mar 26, 2026",
    title: "Member Meeting: April 2026 recap",
    body: "Our March Member Meeting is in the books! Pitching Companies: Aris Hydronics, TerraSafe, RUSHNU."
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarStack = __ds_scope.AvatarStack;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.CountChip = __ds_scope.CountChip;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.GroupHeader = __ds_scope.GroupHeader;

__ds_ns.RatingCell = __ds_scope.RatingCell;

__ds_ns.RatingMatrix = __ds_scope.RatingMatrix;

__ds_ns.SEGMENTED_SCALES = __ds_scope.SEGMENTED_SCALES;

__ds_ns.SegmentedRating = __ds_scope.SegmentedRating;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SearchInput = __ds_scope.SearchInput;

__ds_ns.SelectControl = __ds_scope.SelectControl;

__ds_ns.StageTabs = __ds_scope.StageTabs;

__ds_ns.Toggle = __ds_scope.Toggle;

__ds_ns.UnderlineTabs = __ds_scope.UnderlineTabs;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.ActivityRail = __ds_scope.ActivityRail;

__ds_ns.ChatFab = __ds_scope.ChatFab;

__ds_ns.CompanyCard = __ds_scope.CompanyCard;

__ds_ns.ConfirmationSummary = __ds_scope.ConfirmationSummary;

__ds_ns.CtaBanner = __ds_scope.CtaBanner;

__ds_ns.DetailSheet = __ds_scope.DetailSheet;

__ds_ns.EventItem = __ds_scope.EventItem;

__ds_ns.MemberRow = __ds_scope.MemberRow;

__ds_ns.NewsRow = __ds_scope.NewsRow;

__ds_ns.SectionCard = __ds_scope.SectionCard;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.SlackStrip = __ds_scope.SlackStrip;

__ds_ns.TopNav = __ds_scope.TopNav;

})();
