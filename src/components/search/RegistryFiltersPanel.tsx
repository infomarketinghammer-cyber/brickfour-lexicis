import React, { useEffect, useState } from 'react';
import * as api from '../../api/client';
import { FilterOption, RegistryFilters, SearchFilterOptions } from '../../api/client';

/** Display names for the selected district and court (their option lists load on demand). */
export interface LocationLabels {
  district?: string;
  court?: string;
}

interface RegistryFiltersPanelProps {
  options: SearchFilterOptions | null;
  filters: RegistryFilters;
  /** `apply` is true for choices that should re-run the current search right away (dropdowns) */
  onChange: (filters: RegistryFilters, apply: boolean) => void;
  onApply: () => void;
  onLocationLabelsChange: (labels: LocationLabels) => void;
  /** Result counts per filter value from the last search */
  facetCounts?: Record<string, Record<string, number>>;
  hasSearched: boolean;
}

/** Adds result counts from the last search to option labels and lists matching options first. */
function withCounts(list: FilterOption[], counts?: Record<string, number>): FilterOption[] {
  if (!counts || Object.keys(counts).length === 0) return list;
  const counted = list
    .filter(o => counts[o.value] !== undefined)
    .sort((a, b) => counts[b.value] - counts[a.value])
    .map(o => ({ value: o.value, label: `${o.label} (${counts[o.value].toLocaleString('en-IN')})` }));
  const rest = list.filter(o => counts[o.value] === undefined);
  return [...counted, ...rest];
}

const SORT_OPTIONS: FilterOption[] = [
  { value: '', label: 'Best match' },
  { value: 'filingDate desc', label: 'Newest filed first' },
  { value: 'filingDate asc', label: 'Oldest filed first' },
  { value: 'decisionDate desc', label: 'Recently decided first' },
  { value: 'nextHearingDate asc', label: 'Next hearing date (earliest first)' }
];

const NAME_MATCH_OPTIONS: FilterOption[] = [
  { value: '', label: 'All words (default)' },
  { value: 'any', label: 'Any word' },
  { value: 'phrase', label: 'Exact phrase' },
  { value: 'fuzzy', label: 'Fuzzy (spelling variations)' }
];

const YES_NO: FilterOption[] = [
  { value: '', label: 'Any' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' }
];

const fieldClass = 'w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-400';
const labelClass = 'block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1';

function SelectField({ label, value, options, onChange, anyLabel = 'Any', disabled }: {
  label: string;
  value?: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  anyLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={fieldClass}>
        {anyLabel !== '' && <option value="">{anyLabel}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fieldClass} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-700">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

/** Every filter the eCourts registry search supports. */
export default function RegistryFiltersPanel({ options, filters, onChange, onApply, onLocationLabelsChange, facetCounts, hasSearched }: RegistryFiltersPanelProps) {
  const [districts, setDistricts] = useState<FilterOption[]>([]);
  const [courts, setCourts] = useState<FilterOption[]>([]);
  const counts = (field: string) => facetCounts?.[field];

  useEffect(() => {
    onLocationLabelsChange({
      district: districts.find(d => d.value === filters.districtCode)?.label,
      court: courts.find(c => c.value === filters.courtCode)?.label
    });
  }, [districts, courts, filters.districtCode, filters.courtCode]);

  // Dropdowns apply at once; typed fields wait for Enter or "Apply Filters"
  const set = (patch: Partial<RegistryFilters>) => onChange({ ...filters, ...patch }, true);
  const type = (patch: Partial<RegistryFilters>) => onChange({ ...filters, ...patch }, false);

  useEffect(() => {
    if (!filters.stateCode) {
      setDistricts([]);
      return;
    }
    api.getDistricts(filters.stateCode).then(setDistricts).catch(() => setDistricts([]));
  }, [filters.stateCode]);

  useEffect(() => {
    const level = filters.courtLevel || '';
    if (!filters.stateCode && level !== 'SC' && level !== 'HC') {
      setCourts([]);
      return;
    }
    api.getCourts(filters.stateCode || '', filters.districtCode || '', level).then(setCourts).catch(() => setCourts([]));
  }, [filters.stateCode, filters.districtCode, filters.courtLevel]);

  const years: FilterOption[] = [];
  const range = options?.yearRange || { min: 1947, max: new Date().getFullYear() };
  for (let y = range.max; y >= range.min; y--) years.push({ value: String(y), label: String(y) });

  return (
    <div className="pt-3 border-t border-slate-200/80 space-y-4" id="registry-filters-panel">
      {!options && (
        <p className="text-[11px] text-slate-500">Loading registry filter options…</p>
      )}

      <Section title="Court">
        <SelectField label="Court Level" value={filters.courtLevel} options={options?.courtLevels || []}
          onChange={(v) => set({ courtLevel: v, courtCode: '' })} anyLabel="All levels" />
        <SelectField label="State" value={filters.stateCode} options={withCounts(options?.states || [], counts('stateCode'))}
          onChange={(v) => set({ stateCode: v, districtCode: '', courtCode: '' })} anyLabel="All states" />
        <SelectField label="District" value={filters.districtCode} options={withCounts(districts, counts('districtCode'))}
          onChange={(v) => set({ districtCode: v, courtCode: '' })} anyLabel={filters.stateCode ? 'All districts' : 'Select a state first'}
          disabled={!filters.stateCode} />
        <SelectField label="Court / Establishment" value={filters.courtCode} options={withCounts(courts, counts('courtCode'))}
          onChange={(v) => set({ courtCode: v })}
          anyLabel={courts.length ? 'All courts' : 'Select a state or court level'} disabled={courts.length === 0} />
      </Section>

      <Section title="Case">
        <SelectField label="Case Type" value={filters.caseType} options={withCounts(options?.caseTypes || [], counts('caseType'))} onChange={(v) => set({ caseType: v })} anyLabel="All case types" />
        <SelectField label="Case Status" value={filters.caseStatus} options={withCounts(options?.caseStatuses || [], counts('caseStatus'))} onChange={(v) => set({ caseStatus: v })} anyLabel="Any status" />
        <SelectField label="Case Category" value={filters.caseCategory} options={options?.caseCategories || []} onChange={(v) => set({ caseCategory: v })} anyLabel="All categories" />
        <SelectField label="Judicial Section" value={filters.judicialSection} options={options?.judicialSections || []} onChange={(v) => set({ judicialSection: v })} anyLabel="All sections" />
        <SelectField label="Bench" value={filters.benchType} options={withCounts(options?.benchTypes || [], counts('benchType'))} onChange={(v) => set({ benchType: v })} anyLabel="Any bench" />
        <SelectField label="Has Orders" value={filters.hasOrders} options={withCounts(YES_NO.slice(1), counts('hasOrders'))} onChange={(v) => set({ hasOrders: v })} />
        <SelectField label="Has Judgments" value={filters.hasJudgments} options={withCounts(YES_NO.slice(1), counts('hasJudgments'))} onChange={(v) => set({ hasJudgments: v })} />
        <TextField label="Act / Section" value={filters.actsAndSections} onChange={(v) => type({ actsAndSections: v })} placeholder="e.g. Motor Vehicles Act 166" />
      </Section>

      <Section title="Dates">
        <SelectField label="Filing Year" value={filters.filingYear} options={withCounts(years, counts('filingYear'))} onChange={(v) => set({ filingYear: v })} anyLabel="Any year" />
        <SelectField label="Decision Year" value={filters.decisionYear} options={withCounts(years, counts('decisionYear'))} onChange={(v) => set({ decisionYear: v })} anyLabel="Any year" />
        <TextField label="Filed From" type="date" value={filters.filingDateFrom} onChange={(v) => type({ filingDateFrom: v })} />
        <TextField label="Filed To" type="date" value={filters.filingDateTo} onChange={(v) => type({ filingDateTo: v })} />
        <TextField label="Decided From" type="date" value={filters.decisionDateFrom} onChange={(v) => type({ decisionDateFrom: v })} />
        <TextField label="Decided To" type="date" value={filters.decisionDateTo} onChange={(v) => type({ decisionDateTo: v })} />
      </Section>

      <Section title="Parties, Counsel & Bench">
        <TextField label="Petitioner" value={filters.petitioner} onChange={(v) => type({ petitioner: v })} placeholder="Petitioner / appellant name" />
        <TextField label="Respondent" value={filters.respondent} onChange={(v) => type({ respondent: v })} placeholder="Respondent / defendant name" />
        <TextField label="Either Party" value={filters.litigant} onChange={(v) => type({ litigant: v })} placeholder="Petitioner or respondent" />
        <TextField label="Advocate" value={filters.advocate} onChange={(v) => type({ advocate: v })} placeholder="Advocate name" />
        <TextField label="Judge" value={filters.judge} onChange={(v) => type({ judge: v })} placeholder="Judge name" />
        <SelectField label="Name Matching" value={filters.nameMatchMode} options={NAME_MATCH_OPTIONS.slice(1)} onChange={(v) => set({ nameMatchMode: v })} anyLabel={NAME_MATCH_OPTIONS[0].label} />
        <SelectField label="Sort By" value={filters.sortBy} options={SORT_OPTIONS.slice(1)} onChange={(v) => set({ sortBy: v })} anyLabel={SORT_OPTIONS[0].label} />
      </Section>

      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <p className="text-[11px] text-slate-500">
          {hasSearched
            ? 'Dropdown filters update the results immediately; numbers show how many current results match. Press Enter or Apply Filters after typing names or dates.'
            : 'Choose filters, then press Search. Filters can also be changed after searching to narrow the results.'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({}, true)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer transition-colors"
            id="btn-clear-registry-filters"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={onApply}
            className="text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-xs"
            id="btn-apply-registry-filters"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

/** Human-readable labels for the filters currently applied. */
export function describeActiveFilters(filters: RegistryFilters, options: SearchFilterOptions | null, locationLabels: LocationLabels = {}): string[] {
  const labelOf = (list: FilterOption[] | undefined, value?: string) => list?.find(o => o.value === value)?.label || value;
  const out: string[] = [];
  if (filters.courtLevel) out.push(`Level: ${labelOf(options?.courtLevels, filters.courtLevel)}`);
  if (filters.stateCode) out.push(`State: ${labelOf(options?.states, filters.stateCode)}`);
  if (filters.districtCode) out.push(`District: ${locationLabels.district || filters.districtCode}`);
  if (filters.courtCode) out.push(`Court: ${locationLabels.court || filters.courtCode}`);
  if (filters.caseType) out.push(`Type: ${labelOf(options?.caseTypes, filters.caseType)}`);
  if (filters.caseStatus) out.push(`Status: ${labelOf(options?.caseStatuses, filters.caseStatus)}`);
  if (filters.caseCategory) out.push(`Category: ${labelOf(options?.caseCategories, filters.caseCategory)}`);
  if (filters.judicialSection) out.push(`Section: ${labelOf(options?.judicialSections, filters.judicialSection)}`);
  if (filters.benchType) out.push(`Bench: ${filters.benchType}`);
  if (filters.hasOrders) out.push(`Has orders: ${filters.hasOrders === 'true' ? 'Yes' : 'No'}`);
  if (filters.hasJudgments) out.push(`Has judgments: ${filters.hasJudgments === 'true' ? 'Yes' : 'No'}`);
  if (filters.actsAndSections) out.push(`Act: ${filters.actsAndSections}`);
  if (filters.filingYear) out.push(`Filed in ${filters.filingYear}`);
  if (filters.decisionYear) out.push(`Decided in ${filters.decisionYear}`);
  if (filters.filingDateFrom || filters.filingDateTo) out.push(`Filed ${filters.filingDateFrom || '…'} → ${filters.filingDateTo || '…'}`);
  if (filters.decisionDateFrom || filters.decisionDateTo) out.push(`Decided ${filters.decisionDateFrom || '…'} → ${filters.decisionDateTo || '…'}`);
  if (filters.petitioner) out.push(`Petitioner: ${filters.petitioner}`);
  if (filters.respondent) out.push(`Respondent: ${filters.respondent}`);
  if (filters.litigant) out.push(`Party: ${filters.litigant}`);
  if (filters.advocate) out.push(`Advocate: ${filters.advocate}`);
  if (filters.judge) out.push(`Judge: ${filters.judge}`);
  if (filters.nameMatchMode) out.push(`Match: ${filters.nameMatchMode}`);
  if (filters.sortBy) out.push(`Sort: ${SORT_OPTIONS.find(o => o.value === filters.sortBy)?.label || filters.sortBy}`);
  return out;
}
