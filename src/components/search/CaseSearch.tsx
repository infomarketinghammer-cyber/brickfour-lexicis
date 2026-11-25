/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Search, Loader2, Plus, Check, Landmark, AlertCircle, Filter, X, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Case } from '../../types';
import * as api from '../../api/client';
import { RegistryFilters, SearchFilterOptions } from '../../api/client';
import SearchResultCard from './SearchResultCard';
import CasePreviewPanel from './CasePreviewPanel';
import KanoonDocumentModal, { KanoonDocumentView } from './KanoonDocumentModal';
import RegistryFiltersPanel, { describeActiveFilters, LocationLabels } from './RegistryFiltersPanel';

type SearchBy = 'all' | 'cnr' | 'party' | 'company' | 'name';
type SourceFilter = 'all' | 'ecourts' | 'kanoon';

interface CaseSearchProps {
  trackedCaseIds: string[];
  onTrackCase: (c: Case) => Promise<void>;
  onTrackCasesBulk: (cases: Case[]) => Promise<void>;
  onUntrackCase: (c: Case) => void;
}

const SOURCE_PILLS: { id: SourceFilter; activeClassName: string; content: React.ReactNode }[] = [
  {
    id: 'all',
    activeClassName: 'bg-brand-600 text-white shadow-xs',
    content: (
      <>
        <span>All Registries</span>
        <span className="text-[10px] opacity-75 font-normal">(eCourts + Indian Kanoon)</span>
      </>
    )
  },
  { id: 'ecourts', activeClassName: 'bg-sky-900 text-sky-200 shadow-xs', content: <span>🏛️ eCourts India</span> },
  { id: 'kanoon', activeClassName: 'bg-purple-900 text-purple-200 shadow-xs', content: <span>📜 Indian Kanoon</span> }
];

export default function CaseSearch({ trackedCaseIds, onTrackCase, onTrackCasesBulk, onUntrackCase }: CaseSearchProps) {
  const [query, setQuery] = useState('');
  const [searchBy, setSearchBy] = useState<SearchBy>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  // eCourts registry filters
  const [filters, setFilters] = useState<RegistryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<SearchFilterOptions | null>(null);
  const [locationLabels, setLocationLabels] = useState<LocationLabels>({});

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Case[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHits, setTotalHits] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [facetCounts, setFacetCounts] = useState<Record<string, Record<string, number>>>({});
  const [registryWarning, setRegistryWarning] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [viewingKanoonDoc, setViewingKanoonDoc] = useState<KanoonDocumentView | null>(null);

  // Distinguishes "no results" from "not searched yet"
  const [hasSearched, setHasSearched] = useState(false);

  // Bulk selection
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkTracking, setBulkTracking] = useState(false);

  // Filter options come from the registry's facet catalog
  useEffect(() => {
    api.getSearchFilterOptions().then(setFilterOptions).catch(err => console.warn("Could not load registry filters:", err));
  }, []);

  const activeFilterLabels = describeActiveFilters(filters, filterOptions, locationLabels);

  const fetchSearchResults = async (q: string, by: SearchBy, page: number, source: SourceFilter, activeFilters: RegistryFilters) => {
    setLoading(true);
    setError('');
    setSelectedCase(null);
    setBulkSelectedIds([]);

    try {
      const response = await api.searchCases({ query: q, searchBy: by, page, source, filters: activeFilters });
      setResults(response.results);
      setTotalHits(response.totalHits);
      setTotalPages(response.totalPages);
      setHasNextPage(response.hasNextPage);
      setFacetCounts(response.facetCounts || {});
      setRegistryWarning(response.registryError || '');
      setHasSearched(true);
    } catch (err: any) {
      setResults([]);
      setTotalHits(0);
      setHasNextPage(false);
      setRegistryWarning('');
      setError(err.message || "Failed search query.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent, page = 1) => {
    if (e) e.preventDefault();
    setCurrentPage(page);
    fetchSearchResults(query, searchBy, page, sourceFilter, filters);
  };

  const handleSourceChange = (newSource: SourceFilter) => {
    setSourceFilter(newSource);
    setCurrentPage(1);
    fetchSearchResults(query, searchBy, 1, newSource, filters);
  };

  // After a search, dropdown filter changes narrow the current results straight away
  const handleFiltersChange = (next: RegistryFilters, apply: boolean) => {
    setFilters(next);
    if (apply && hasSearched) {
      setCurrentPage(1);
      fetchSearchResults(query, searchBy, 1, sourceFilter, next);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchSearchResults(query, searchBy, 1, sourceFilter, filters);
  };

  const handleResetFilters = () => {
    setQuery('');
    setFilters({});
    setSearchBy('all');
    setCurrentPage(1);
    fetchSearchResults('', 'all', 1, sourceFilter, {});
  };

  const handleOpenKanoonDoc = async (c: Case) => {
    if (!c.kanoonDocId) return;
    setViewingKanoonDoc({
      docId: String(c.kanoonDocId),
      title: c.title,
      doc: '',
      url: c.docUrl || `https://indiankanoon.org/doc/${c.kanoonDocId}/`,
      loading: true
    });

    let update: Partial<KanoonDocumentView>;
    try {
      const data = await api.getKanoonDocument(c.kanoonDocId);
      update = data
        ? { title: data.title, doc: data.doc || 'No text content available for this document.', url: data.url }
        : { doc: 'Could not load full document text from Indian Kanoon API. You can read the judgment directly on Indian Kanoon using the link above.' };
    } catch (e: any) {
      update = { doc: `Error: ${e.message || 'Failed to fetch document'}.` };
    }
    setViewingKanoonDoc(prev => prev ? {
      ...prev,
      title: update.title || prev.title,
      doc: update.doc || prev.doc,
      url: update.url || prev.url,
      loading: false
    } : null);
  };

  // Hearing reminders are re-scanned so newly bound cases get their alerts
  const trackCase = (c: Case) => {
    setAddingId(c.id);
    setBulkSelectedIds(prev => prev.filter(id => id !== c.id));
    onTrackCase(c)
      .then(() => api.runScheduler())
      .catch(err => console.error("Background track error:", err))
      .finally(() => setAddingId(null));
  };

  const handleBulkTrack = () => {
    if (bulkSelectedIds.length === 0) return;
    setBulkTracking(true);
    const selectedCasesData = results.filter(c => bulkSelectedIds.includes(c.id));
    setBulkSelectedIds([]);
    onTrackCasesBulk(selectedCasesData)
      .then(() => api.runScheduler())
      .catch(err => console.error("Background bulk track error:", err))
      .finally(() => setBulkTracking(false));
  };

  const toggleBulkSelection = (caseId: string) => {
    setBulkSelectedIds(prev =>
      prev.includes(caseId)
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const eligibleCases = results.filter(c => !trackedCaseIds.includes(c.id));
  const isAllEligibleSelected = eligibleCases.length > 0 && eligibleCases.every(c => bulkSelectedIds.includes(c.id));

  const toggleSelectAllEligible = () => {
    const eligibleIds = eligibleCases.map(c => c.id);
    if (isAllEligibleSelected) {
      setBulkSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
    } else {
      setBulkSelectedIds(prev => [...prev, ...eligibleIds.filter(id => !prev.includes(id))]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm">

      {/* Search Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2">
            <Landmark className="h-5 w-5 text-amber-600" />
            <span>Lexicis Search Registry</span>
          </h2>
          <div className="flex items-center space-x-2">
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Query Indian District Courts, High Courts, and Supreme Court legal precedents concurrently via official eCourts India and Indian Kanoon.
        </p>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSearch} className="space-y-3 mb-6 bg-slate-50 p-4 border border-slate-200/80 rounded-2xl">
        {/* Registry Source Selector Pills */}
        <div className="flex items-center flex-wrap gap-1.5 pb-1">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center space-x-1">
            <Filter className="h-3 w-3 text-slate-400" />
            <span>Registry:</span>
          </span>
          {SOURCE_PILLS.map(pill => (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleSourceChange(pill.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                sourceFilter === pill.id
                  ? pill.activeClassName
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {pill.content}
            </button>
          ))}
        </div>

        {/* Search Query Input & Submit */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Name, CNR Number, Party Name, Advocate Name, Company Name..."
              className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 bg-white"
              id="input-case-search"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
              showFilters || activeFilterLabels.length
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            id="btn-toggle-registry-filters"
            title="eCourts registry filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Registry Filters</span>
            {activeFilterLabels.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded">{activeFilterLabels.length}</span>
            )}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white hover:bg-brand-700 border border-brand-700 hover:border-brand-500 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            id="btn-search-cases"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>

        {showFilters && (
          <RegistryFiltersPanel
            options={filterOptions}
            filters={filters}
            onChange={handleFiltersChange}
            onApply={handleApplyFilters}
            onLocationLabelsChange={setLocationLabels}
            facetCounts={facetCounts}
            hasSearched={hasSearched}
          />
        )}

        {/* Active Filters & Reset Bar */}
        {(query || activeFilterLabels.length > 0) && (
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Active Query:</span>
              {query && (
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  Term: "{query}"
                </span>
              )}
              {activeFilterLabels.map(label => (
                <span key={label} className="bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  {label}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Clear Search</span>
            </button>
          </div>
        )}
      </form>

      {registryWarning && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium px-3.5 py-2.5 rounded-xl flex items-start space-x-2" id="registry-warning">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>eCourts results are missing: {registryWarning} Showing Indian Kanoon results only.</span>
        </div>
      )}

      {/* Bulk Track Notification Banner */}
      {bulkSelectedIds.length > 0 && (
        <div className="bg-brand-700 border border-brand-600 rounded-xl p-3.5 mb-6 text-white flex items-center justify-between animate-fade-in shadow-md">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg font-extrabold text-sm flex items-center justify-center">
              {bulkSelectedIds.length}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">Multiple Cases Selected</p>
              <p className="text-[10px] text-slate-400">Ready to track and sync concurrently to your dashboard portfolio</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setBulkSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkTrack}
              disabled={bulkTracking}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              id="btn-track-selected-bulk"
            >
              {bulkTracking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Bind Selected ({bulkSelectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left Side: Result List */}
        <div>
          <div className="flex items-center justify-between min-h-[34px] mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Official Registry Matches
              </h3>
              {hasSearched && (
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="text-[11px] font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                  id="btn-filter-results"
                  title="Narrow these results with eCourts registry filters"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Filter Results</span>
                </button>
              )}
            </div>

            {eligibleCases.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllEligible}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200/60 transition-colors"
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                  isAllEligibleSelected
                    ? 'bg-amber-500 border-amber-600 text-slate-950'
                    : 'border-slate-350 bg-white'
                }`}>
                  {isAllEligibleSelected && <Check className="h-2.5 w-2.5 stroke-[3.5] text-slate-950" />}
                </div>
                <span>{isAllEligibleSelected ? 'Deselect All' : 'Select All Matches'}</span>
              </button>
            )}
          </div>

          {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}

          <div className={`space-y-2.5 max-h-[420px] overflow-y-auto ${results.length ? 'pr-1' : ''}`}>
            {results.length === 0 ? (
              <div className="p-5 min-h-[280px] flex flex-col justify-center text-center border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                {/* A failed search is not evidence that no case exists */}
                {hasSearched && !error ? (
                  <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-5 text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                    <h4 className="text-sm font-bold text-rose-950">No Filing Found in Lexicis Search Registry</h4>
                    <p className="text-xs text-rose-800 font-medium">
                      Case is not filed on this Name, CNR, Party Name, or Company Name
                      {activeFilterLabels.length ? ` with the selected filters (${activeFilterLabels.join(', ')})` : ''}.
                    </p>
                    <p className="text-[11px] text-rose-600">
                      Search parameter: <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded font-bold">{query || "All Records"}</span> via filter category <span className="font-semibold uppercase text-rose-900">{searchBy}</span>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Search className="h-10 w-10 text-slate-300 mx-auto stroke-[1.5]" />
                    <p className="text-slate-700 font-semibold text-xs">Ready for Lexicis Search Registry Query</p>
                  </div>
                )}
              </div>
            ) : (
              results.map(c => (
                <SearchResultCard
                  key={c.id}
                  caseItem={c}
                  isTracked={trackedCaseIds.includes(c.id)}
                  isSelected={selectedCase?.id === c.id}
                  isBulkSelected={bulkSelectedIds.includes(c.id)}
                  isAdding={addingId === c.id}
                  onSelect={() => setSelectedCase(c)}
                  onToggleBulk={() => toggleBulkSelection(c.id)}
                  onTrack={() => trackCase(c)}
                  onUntrack={() => onUntrackCase(c)}
                />
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {results.length > 0 && (
            <div className="flex items-center justify-center space-x-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleSearch(undefined, currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-50 cursor-pointer hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-900">
                Page {currentPage}{totalPages > 1 ? ` of ${totalPages.toLocaleString('en-IN')}` : ''}
                {totalHits > 0 && <span className="font-normal text-slate-500"> · {totalHits.toLocaleString('en-IN')} matches</span>}
              </span>
              <button
                onClick={() => handleSearch(undefined, currentPage + 1)}
                disabled={!hasNextPage || loading}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-50 cursor-pointer hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Preview & Detailed metadata (heading mirrors the left column so both panels line up) */}
        <div>
          <div className="flex items-center min-h-[34px] mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Case Preview
            </h3>
          </div>
          <CasePreviewPanel
            selectedCase={selectedCase}
            isTracked={!!selectedCase && trackedCaseIds.includes(selectedCase.id)}
            isAdding={!!selectedCase && addingId === selectedCase.id}
            onTrack={trackCase}
            onUntrack={onUntrackCase}
            onOpenKanoonDoc={handleOpenKanoonDoc}
          />
        </div>

      </div>

      {viewingKanoonDoc && (
        <KanoonDocumentModal document={viewingKanoonDoc} onClose={() => setViewingKanoonDoc(null)} />
      )}

    </div>
  );
}
