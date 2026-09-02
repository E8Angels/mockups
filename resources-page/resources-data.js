/* Builds the page model from window.RES_ROWS (resources-sheet.js — verbatim sheet).
   Rules:
   1. Column E "Shown on UI": 'Y' renders, 'N' / blank does not. 'March 2027' renders
      as a held item under Decarbon8. Excluded rows stay in the sheet file.
   2. Column C "Order" sorts within the Section.
   3. Column G "Short Description" is the blurb under each title.
   4. Column H "Media Type" drives the type tile. */
(function () {
  const SECTION_META = {
    'Introduction': {
      id: 'introduction', kicker: 'Start here',
      blurb: 'The agreement, the handbook and the orientation recording every new member gets.'
    },
    "You're meeting: Entrepreneurs": {
      id: 'entrepreneurs', kicker: 'Sourcing',
      blurb: 'Take these into a founder conversation, then send the lead back to the team.'
    },
    "You're meeting: Partners": {
      id: 'partners', kicker: 'Sourcing',
      blurb: 'Material for partner conversations.'
    },
    "You're meeting: Sponsors etc?": {
      id: 'sponsors', kicker: 'Sourcing',
      blurb: 'Sponsor conversations run through the E8 team.'
    },
    'Pipeline': {
      id: 'pipeline', kicker: 'Evaluation & diligence',
      blurb: 'The pipeline in order, from screening an application through to the diligence wrap.'
    },
    'Policy': {
      id: 'policy', kicker: 'Policy',
      blurb: 'The policies that govern how E8 handles data, tools and investments.'
    },
    'Fellows': {
      id: 'fellows', kicker: 'Programme',
      blurb: 'Orientation and handbook for the Fellows cohorts.'
    },
    'Decarbon8': {
      id: 'decarbon8', kicker: 'March 2027',
      blurb: 'Scoped for the 2027 cycle. Held until release.', locked: true
    }
  };

  const MEDIA = {
    'Document':    { type: 'doc',   label: 'DOC' },
    'Slides':      { type: 'deck',  label: 'SLIDES' },
    'Video':       { type: 'video', label: 'VIDEO' },
    'Portal link': { type: 'form',  label: 'LINK' }
  };

  const AUDIENCE = { 'Members': 'members', 'All': 'all', 'Fellows': 'fellows', 'N/a': 'all' };

  const TYPE = {
    video: { label: 'VIDEO',  tint: '#07312C', ink: '#FFFFFF' },
    deck:  { label: 'SLIDES', tint: '#ECF5F2', ink: '#0F5049' },
    pdf:   { label: 'PDF',    tint: '#FDF6EE', ink: '#96591C' },
    doc:   { label: 'DOC',    tint: '#F7F8F6', ink: '#45524D' },
    form:  { label: 'LINK',   tint: '#ECF1F6', ink: '#2D65BC' },
    contact:{ label: 'ASK',   tint: '#F7F8F6', ink: '#66746E' }
  };

  /* Poster frames. Only real, fetchable sources are used:
     - YouTube: the video's own thumbnail (hqdefault).
     - Google Drive/Docs: Drive's rendered first-page thumbnail. Requires the file to be
       link-visible; falls back to the tinted type tile when it 404s.
     Everything else has no poster until real artwork or a Drive link is supplied. */
  function posterFor(r) {
    const link = String(r.link || '');
    let m = link.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{6,})/);
    if (m) return 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg';
    m = link.match(/(?:docs\.google\.com\/[a-z]+\/d\/|drive\.google\.com\/file\/d\/)([A-Za-z0-9_-]{10,})/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w800';
    return null;
  }

  /* Viewer embed: renders the file inside the portal instead of navigating away.
     Docs -> /preview, Slides -> /embed, YouTube -> /embed. Anything else opens externally. */
  function embedFor(r) {
    const link = String(r.link || '');
    let m = link.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{6,})/);
    if (m) return 'https://www.youtube.com/embed/' + m[1];
    m = link.match(/docs\.google\.com\/document\/d\/([A-Za-z0-9_-]{10,})/);
    if (m) return 'https://docs.google.com/document/d/' + m[1] + '/preview';
    m = link.match(/docs\.google\.com\/presentation\/d\/([A-Za-z0-9_-]{10,})/);
    if (m) return 'https://docs.google.com/presentation/d/' + m[1] + '/embed?start=false&loop=false';
    return null;
  }

  const rows = window.RES_ROWS || [];
  const order = Object.keys(SECTION_META);
  const sections = [];

  order.forEach(name => {
    const meta = SECTION_META[name];
    const list = rows
      .filter(r => r.section === name && String(r.shown || '').trim() === 'Y')
      .sort((a, b) => (a.order || 99) - (b.order || 99));
    if (!list.length) return;

    const items = list.map(r => {
      const m = MEDIA[r.media] || MEDIA.Document;
      const planned = /2027/.test(String(r.tag || ''));
      return {
        title: r.name,
        desc: r.desc || '',
        type: m.type,
        typeLabel: m.label,
        status: planned ? 'planned' : 'live',
        audience: AUDIENCE[r.audience] || 'all',
        source: r.link || '',
        tag: r.tag || '',
        link: /^https?:/.test(r.link || '') ? r.link : null,
        poster: posterFor(r),
        embed: embedFor(r)
      };
    });

    sections.push({
      id: meta.id,
      title: name,
      kicker: meta.kicker,
      blurb: meta.blurb,
      locked: !!meta.locked,
      groups: [{ title: '', items: items }]
    });
  });

  window.RES_DATA = { sections: sections, TYPE: TYPE, MEDIA: MEDIA };
})();
