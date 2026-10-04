import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Field, Select, TextArea, TextInput } from '../ui.jsx'
import { CATALOGUE_PATH, PUBLIC_FILES_DIR } from '../../lib/constants.js'
import { normaliseFilename, slugify } from '../../lib/fileUtils.js'

const CUSTOM_VALUE = '__custom__'

function CategoryField({ value, onChange, categories, error, id }) {
  const isPreset = categories.includes(value)
  const [customMode, setCustomMode] = useState(!isPreset && Boolean(value))

  return (
    <Field
      label="Category"
      htmlFor={id}
      required
      error={error}
      hint="Categories power the filter chips on the public library page."
    >
      <Select
        id={id}
        value={customMode ? CUSTOM_VALUE : value}
        invalid={Boolean(error)}
        onChange={(event) => {
          if (event.target.value === CUSTOM_VALUE) {
            setCustomMode(true)
            onChange('')
          } else {
            setCustomMode(false)
            onChange(event.target.value)
          }
        }}
      >
        <option value="" disabled>
          Choose a category…
        </option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>Other — type a new category…</option>
      </Select>
      {customMode ? (
        <TextInput
          className="mt-2"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. Question papers"
          aria-label="New category name"
        />
      ) : null}
    </Field>
  )
}

/**
 * EntryForm — the metadata fields for a catalogue entry.
 * Values are controlled by the parent so validation can run on every keystroke.
 */
export function EntryForm({ values, onChange, errors = {}, categories = [], disabled = false }) {
  function set(field, value) {
    onChange({ ...values, [field]: value })
  }

  const filename = values.filename ?? ''
  const derived = {
    id: slugify(filename) || '—',
    url: filename ? `/files/${filename}` : '—',
  }

  return (
    <div className="space-y-5">
      <Field label="Title" htmlFor="entry-title" required error={errors.title} hint="Shown as the heading on the file card.">
        <TextInput
          id="entry-title"
          value={values.title ?? ''}
          onChange={(event) => set('title', event.target.value)}
          placeholder="e.g. Data Structures & Algorithms — Revision Notes"
          invalid={Boolean(errors.title)}
          disabled={disabled}
          maxLength={120}
        />
      </Field>

      <CategoryField
        id="entry-category"
        value={values.category ?? ''}
        onChange={(value) => set('category', value)}
        categories={categories}
        error={errors.category}
      />

      <Field
        label="Filename"
        htmlFor="entry-filename"
        required
        error={errors.filename}
        hint={
          <>
            Must match the file you place in{' '}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">{PUBLIC_FILES_DIR}</code> exactly. Keep it
            lowercase, hyphenated and free of spaces.
          </>
        }
      >
        <div className="flex gap-2">
          <TextInput
            id="entry-filename"
            value={filename}
            onChange={(event) => set('filename', event.target.value)}
            placeholder="e.g. dsa-notes.pdf"
            invalid={Boolean(errors.filename)}
            disabled={disabled}
            className="font-mono text-xs"
          />
          <Button
            variant="secondary"
            size="md"
            className="shrink-0"
            disabled={disabled || !filename}
            onClick={() => set('filename', normaliseFilename(filename))}
            title="Convert to a safe lowercase filename"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Normalise
          </Button>
        </div>
      </Field>

      <Field
        label="Description"
        htmlFor="entry-description"
        hint="One or two sentences. It appears on the card and on the file detail page."
      >
        <TextArea
          id="entry-description"
          rows={4}
          value={values.description ?? ''}
          onChange={(event) => set('description', event.target.value)}
          placeholder="What is inside the file, and who is it for?"
          disabled={disabled}
          maxLength={400}
        />
      </Field>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Derived values</p>
        <dl className="mt-2 space-y-1.5 font-mono text-xs text-slate-700">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-500">id</dt>
            <dd className="truncate">{derived.id}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-500">url</dt>
            <dd className="truncate">{derived.url}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-500">size</dt>
            <dd className="truncate">read from the selected file (bytes)</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-500">adds to</dt>
            <dd className="truncate">{CATALOGUE_PATH}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
