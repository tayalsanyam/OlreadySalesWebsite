'use client';
import {useMemo, useState} from 'react';
import {ArrowRight, FloppyDisk, ListBullets, Plus, SquaresFour, Trash, ImageSquare, UploadSimple} from '@phosphor-icons/react';
import type {Site} from '@/lib/schema';
import {csvTemplate, importArtistCatalog} from '@/lib/directory-import';
import {featuredArtist, publishedArtist, suggestArtistSlug} from '@/lib/artist-catalog';
import {artistPath} from '@/lib/seo';
import {downloadCsv} from '@/lib/admin-csv';
import {Asset, Field} from './TaskEditors';

type DraftBar = {dirty: boolean; busy: boolean; onSave: () => void; onPublish: () => void; canPublish: boolean};
type Props = {site: Site; onChange: (s: Site) => void; fallback: (value: any, field: string, onChange: (v: any) => void) => React.ReactNode; draft?: DraftBar};

function artistStatus(a: Site['artists'][number]) {
 if (featuredArtist(a)) return 'Featured';
 if (publishedArtist(a)) return 'Published (SEO)';
 if (a.approved) return 'Approved';
 return 'Draft';
}

function artistExportRows(artists: Site['artists']) {
 return artists.map((a) => ({
  name: a.name,
  city: a.city,
  slug: a.slug || '',
  status: artistStatus(a),
  approved: a.approved ? 'yes' : 'no',
  consent: a.consent ? 'yes' : 'no',
  featuredTopGrossing: a.featuredTopGrossing ? 'yes' : 'no',
  profileUrl: a.profileUrl,
  image: a.image,
  instagram: a.instagram || '',
  services: (a.services || []).join('|'),
  keywords: a.keywords || '',
  bio: a.bio || '',
 }));
}

export function ArtistEditor({site, onChange, draft}: Props) {
 const [selected, setSelected] = useState('');
 const [importStatus, setImportStatus] = useState('');
 const [filter, setFilter] = useState('');
 const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not'>('all');
 const [view, setView] = useState<'cards' | 'list'>('cards');
 const artist = site.artists.find((a) => a.id === selected);
 const patch = (v: Partial<Site['artists'][number]>) =>
  onChange({...site, artists: site.artists.map((a) => (a.id === selected ? {...a, ...v} : a))});

 function add() {
  const id = crypto.randomUUID();
  onChange({
   ...site,
   artists: [
    ...site.artists,
    {
     id,
     slug: '',
     name: 'New artist',
     city: '',
     bio: '',
     keywords: '',
     instagram: '',
     services: [],
     gallery: [],
     image: '',
     profileUrl: '',
     amountPaise: null,
     definition: 'Gross booking value',
     period: '',
     evidence: '',
     consent: false,
     approved: false,
     featuredTopGrossing: false,
     expires: '',
     video: '',
     poster: '',
     transcript: '',
    },
   ],
  });
  setSelected(id);
 }

 function importCsv(text: string) {
  try {
   const {artists, skipped} = importArtistCatalog(text, site.artists);
   onChange({...site, artists: [...site.artists, ...artists]});
   setImportStatus(`Added ${artists.length} profile${artists.length === 1 ? '' : 's'}. Skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}. Save your draft when finished.`);
  } catch (e) {
   setImportStatus((e as Error).message);
  }
 }

 function removeArtist(id: string, name: string) {
  if (!window.confirm(`Remove “${name}” from the draft? Save and publish to update the live site.`)) return;
  onChange({...site, artists: site.artists.filter((a) => a.id !== id)});
  if (selected === id) setSelected('');
 }

 const filtered = useMemo(() => {
  const q = filter.trim().toLowerCase();
  return site.artists.filter((a) => {
   if (featuredFilter === 'featured' && !a.featuredTopGrossing) return false;
   if (featuredFilter === 'not' && a.featuredTopGrossing) return false;
   if (!q) return true;
   const hay = `${a.name} ${a.city} ${a.slug || ''} ${(a.services || []).join(' ')} ${a.keywords || ''}`.toLowerCase();
   return hay.includes(q);
  });
 }, [site.artists, filter, featuredFilter]);

 if (artist) {
  return (
   <div className="artist-catalog-workspace">
    <button type="button" className="text-button catalog-back" onClick={() => setSelected('')}>
     ← Back to catalog
    </button>
    <div className="task-split">
     <div className="task-section">
      <p className="field-group-label">ARTIST PROFILE</p>
      <Field title="Artist name" value={artist.name} change={(name) => patch({name})} />
      <Field title="City" value={artist.city} change={(city) => patch({city})} />
      <Field
       title="Public URL slug (optional)"
       value={artist.slug || ''}
       hint={`Live URL: ${artistPath({...artist, slug: artist.slug || suggestArtistSlug(artist)})}. Lowercase letters, numbers and hyphens only.`}
       change={(slug) =>
        patch({
         slug: slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-|-$/g, ''),
        })
       }
      />
      <Field title="Short bio" value={artist.bio || ''} multi hint="Up to 1,500 characters. Shown on the public profile." change={(bio) => patch({bio})} />
      <Field title="Additional SEO tags" value={artist.keywords || ''} hint="Comma-separated. Name, city and services are tagged automatically." change={(keywords) => patch({keywords})} />
      <Field
       title="Services offered"
       value={(artist.services || []).join(', ')}
       hint="Comma-separated, e.g. Bridal makeup, HD makeup."
       change={(services) => patch({services: services.split(',').map((s) => s.trim()).filter(Boolean)})}
      />
      <Field title="Instagram handle" value={artist.instagram || ''} hint="Example: @artistname — not a full URL." change={(instagram) => patch({instagram: instagram.trim()})} />
      <Asset folder="artists" title="Portrait" value={artist.image} change={(image) => patch({image})} />
      <Field title="Artist profile link" value={artist.profileUrl} change={(profileUrl) => patch({profileUrl})} />
      <p className="field-group-label">INTERNAL VERIFICATION</p>
      <p className="preview-caption">Never shown publicly. Visitors use &quot;Ask about artist results&quot; on the website.</p>
      <label className="task-field">
       Result amount in rupees (₹)
       <input
        type="number"
        min="0"
        value={artist.amountPaise === null ? '' : artist.amountPaise / 100}
        onChange={(e) => patch({amountPaise: e.target.value === '' ? null : Math.round(Number(e.target.value) * 100)})}
       />
      </label>
      <Field title="What does this amount measure?" value={artist.definition} change={(definition) => patch({definition})} />
      <Field title="Reporting period" value={artist.period} change={(period) => patch({period})} />
      <Field title="Evidence (private)" value={artist.evidence} multi change={(evidence) => patch({evidence})} />
      <Field title="Review / expiry date" type="date" value={artist.expires.slice(0, 10)} change={(date) => patch({expires: date ? date + 'T23:59:00+05:30' : ''})} />
     </div>
     <aside>
      <div className="task-section">
       <h3>Publication</h3>
       <label className="toggle">
        <input type="checkbox" checked={artist.consent} onChange={(e) => patch({consent: e.target.checked})} />
        Artist has agreed to publication
       </label>
       <label className="toggle">
        <input type="checkbox" checked={artist.approved} onChange={(e) => patch({approved: e.target.checked})} />
        Publish profile (SEO page + sitemap)
       </label>
       <label className="toggle">
        <input type="checkbox" checked={!!artist.featuredTopGrossing} onChange={(e) => patch({featuredTopGrossing: e.target.checked})} />
        Featured on Top Grossing & homepage
       </label>
       <p className="preview-caption">Featured artists need verification fields on the left. Save draft, then Review &amp; publish.</p>
      </div>
      <div className="task-section">
       <h3>Video story</h3>
       <Asset folder="artists" kind="video" title="Video URL" value={artist.video} change={(video) => patch({video})} />
       <Asset folder="artists" title="Video cover" value={artist.poster} change={(poster) => patch({poster})} />
       <Field title="Video transcript" value={artist.transcript} multi change={(transcript) => patch({transcript})} />
      </div>
      <div className="task-section">
       <h3>Portfolio</h3>
       {(artist.gallery || []).map((item, i) => (
        <div className="artist-gallery-editor" key={i}>
         <Asset folder="artists" title={`Image ${i + 1}`} value={item.image} change={(image) => patch({gallery: (artist.gallery || []).map((g, j) => (j === i ? {...g, image} : g))})} />
         <Field title="Caption" value={item.caption} change={(caption) => patch({gallery: (artist.gallery || []).map((g, j) => (j === i ? {...g, caption} : g))})} />
         <button type="button" onClick={() => patch({gallery: (artist.gallery || []).filter((_, j) => j !== i)})}>
          Remove
         </button>
        </div>
       ))}
       <button type="button" disabled={(artist.gallery || []).length >= 6} onClick={() => patch({gallery: [...(artist.gallery || []), {image: '', caption: ''}]})}>
        <Plus /> Add image
       </button>
      </div>
      <div className="task-section">
       <h3>Order & removal</h3>
       <button type="button" onClick={() => onChange({...site, artists: [artist, ...site.artists.filter((a) => a.id !== selected)]})}>
        Move to first
       </button>
       <button type="button" className="danger-link" onClick={() => removeArtist(selected, artist.name)}>
        <Trash /> Remove from draft
       </button>
      </div>
     </aside>
    </div>
    {draft && (
     <aside className="admin-draft-bar" aria-live="polite">
      <p>{draft.dirty ? 'Unsaved changes in this draft.' : 'Draft matches last save.'}</p>
      <div>
       <button type="button" onClick={draft.onSave} disabled={draft.busy || !draft.dirty}>
        <FloppyDisk /> Save draft
       </button>
       <button type="button" className="primary" onClick={draft.onPublish} disabled={draft.busy || !draft.canPublish}>
        Review & publish
       </button>
      </div>
     </aside>
    )}
   </div>
  );
 }

 return (
  <div className="artist-catalog-workspace">
   <div className="task-heading">
    <div>
     <h2>Artist catalog</h2>
     <p>Build one list for SEO profiles and Top Grossing. Save your draft, then publish from the workspace header.</p>
    </div>
    <div className="actions catalog-toolbar-actions">
     <button type="button" onClick={() => downloadCsv('olready-artists-' + new Date().toISOString().slice(0, 10) + '.csv', artistExportRows(site.artists))} disabled={!site.artists.length}>
      Download CSV
     </button>
     <button className="primary" type="button" onClick={add}>
      <Plus /> Add artist
     </button>
    </div>
   </div>

   <div className="catalog-list-toolbar">
    <label className="task-field catalog-search">
     <span>Search artists</span>
     <input placeholder="Name, city, slug, services…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Search artists" />
    </label>
    <label className="task-field catalog-featured-filter">
     <span>Featured (Top Grossing)</span>
     <select value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value as 'all' | 'featured' | 'not')} aria-label="Filter by featured">
      <option value="all">All artists</option>
      <option value="featured">Featured only</option>
      <option value="not">Not featured</option>
     </select>
    </label>
    <div className="catalog-view-toggle" role="group" aria-label="Catalog view">
     <button type="button" className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')} aria-pressed={view === 'cards'}>
      <SquaresFour size={18} /> Cards
     </button>
     <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'}>
      <ListBullets size={18} /> List
     </button>
    </div>
   </div>

   <details className="section-editor catalog-import-panel">
    <summary>
     Bulk import (CSV)
     <Plus />
    </summary>
    <div className="task-section">
     <p className="preview-caption">Imports create draft profiles (not featured). Download the template, fill it in, then upload. Duplicates by name/city or profile URL are skipped.</p>
     <div className="catalog-import-actions">
      <button
       type="button"
       onClick={() => {
        const url = URL.createObjectURL(new Blob([csvTemplate], {type: 'text/csv'}));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'olready-artists-template.csv';
        a.click();
        URL.revokeObjectURL(url);
       }}
      >
       Download template
      </button>
      <label className="catalog-import-upload">
       <UploadSimple size={18} /> Upload CSV
       <input
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={async (e) => {
         const f = e.target.files?.[0];
         if (!f) return;
         importCsv(await f.text());
         e.target.value = '';
        }}
       />
      </label>
     </div>
     {importStatus && (
      <p className="preview-caption" role="status">
       {importStatus}
      </p>
     )}
    </div>
   </details>

   {!filtered.length ? (
    site.artists.length ? (
     <p className="preview-caption">No artists match your search.</p>
    ) : (
     <div className="task-empty">
      <ImageSquare size={42} />
      <h3>No artists in your draft yet</h3>
      <p>Add someone manually or import a CSV. Nothing goes live until you save and publish.</p>
      <button type="button" onClick={add}>
       Add your first artist <ArrowRight />
      </button>
     </div>
    )
   ) : view === 'list' ? (
    <div className="table-wrap catalog-artist-table" tabIndex={0} role="region" aria-label="Artist list">
     <table>
      <thead>
       <tr>
        <th>Name</th>
        <th>City</th>
        <th>Status</th>
        <th>Featured</th>
        <th aria-label="Actions" />
       </tr>
      </thead>
      <tbody>
       {filtered.map((a) => (
        <tr key={a.id}>
         <td>
          <button type="button" className="catalog-list-link" onClick={() => setSelected(a.id)}>
           {a.name}
          </button>
         </td>
         <td>{a.city || '—'}</td>
         <td>{artistStatus(a)}</td>
         <td>{a.featuredTopGrossing ? 'Yes' : 'No'}</td>
         <td className="catalog-list-actions">
          <button type="button" onClick={() => setSelected(a.id)}>
           Edit
          </button>
          <button type="button" className="danger-link" onClick={() => removeArtist(a.id, a.name)}>
            Remove
          </button>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   ) : (
    <div className="artist-manager-grid">
     {filtered.map((a) => (
      <button type="button" className="artist-manager-card" key={a.id} onClick={() => setSelected(a.id)}>
       {a.image ? <img src={a.image} alt="" /> : <ImageSquare size={48} />}
       <h3>{a.name}</h3>
       <p>{a.city || 'Add a city'}</p>
       <span className="status-pill">{artistStatus(a)}</span>
      </button>
     ))}
    </div>
   )}

   {draft && (
    <aside className="admin-draft-bar" aria-live="polite">
     <p>{draft.dirty ? 'Unsaved changes in this draft.' : 'Draft matches last save.'}</p>
     <div>
      <button type="button" onClick={draft.onSave} disabled={draft.busy || !draft.dirty}>
       <FloppyDisk /> Save draft
      </button>
      <button type="button" className="primary" onClick={draft.onPublish} disabled={draft.busy || !draft.canPublish}>
       Review & publish
      </button>
     </div>
    </aside>
   )}
  </div>
 );
}
