"use client";

import React, { useState, useRef, useCallback, useId, useMemo } from "react";

// Curated list of ~200 luxury-relevant US cities
const LUXURY_CITIES: Array<{ city: string; state: string; abbr: string }> = [
  { city: "Naples", state: "Florida", abbr: "FL" },
  { city: "Miami", state: "Florida", abbr: "FL" },
  { city: "Miami Beach", state: "Florida", abbr: "FL" },
  { city: "Palm Beach", state: "Florida", abbr: "FL" },
  { city: "Boca Raton", state: "Florida", abbr: "FL" },
  { city: "Fort Lauderdale", state: "Florida", abbr: "FL" },
  { city: "Sarasota", state: "Florida", abbr: "FL" },
  { city: "Tampa", state: "Florida", abbr: "FL" },
  { city: "Orlando", state: "Florida", abbr: "FL" },
  { city: "Jacksonville", state: "Florida", abbr: "FL" },
  { city: "Key West", state: "Florida", abbr: "FL" },
  { city: "Jupiter", state: "Florida", abbr: "FL" },
  { city: "Delray Beach", state: "Florida", abbr: "FL" },
  { city: "Coral Gables", state: "Florida", abbr: "FL" },
  { city: "Marco Island", state: "Florida", abbr: "FL" },
  { city: "Fisher Island", state: "Florida", abbr: "FL" },
  { city: "Bal Harbour", state: "Florida", abbr: "FL" },
  { city: "New York", state: "New York", abbr: "NY" },
  { city: "Manhattan", state: "New York", abbr: "NY" },
  { city: "Brooklyn", state: "New York", abbr: "NY" },
  { city: "Hamptons", state: "New York", abbr: "NY" },
  { city: "Sag Harbor", state: "New York", abbr: "NY" },
  { city: "Montauk", state: "New York", abbr: "NY" },
  { city: "Greenwich", state: "Connecticut", abbr: "CT" },
  { city: "Westport", state: "Connecticut", abbr: "CT" },
  { city: "Darien", state: "Connecticut", abbr: "CT" },
  { city: "New Canaan", state: "Connecticut", abbr: "CT" },
  { city: "Los Angeles", state: "California", abbr: "CA" },
  { city: "Beverly Hills", state: "California", abbr: "CA" },
  { city: "Malibu", state: "California", abbr: "CA" },
  { city: "Bel Air", state: "California", abbr: "CA" },
  { city: "Santa Monica", state: "California", abbr: "CA" },
  { city: "Pacific Palisades", state: "California", abbr: "CA" },
  { city: "San Francisco", state: "California", abbr: "CA" },
  { city: "Palo Alto", state: "California", abbr: "CA" },
  { city: "Atherton", state: "California", abbr: "CA" },
  { city: "Hillsborough", state: "California", abbr: "CA" },
  { city: "San Diego", state: "California", abbr: "CA" },
  { city: "La Jolla", state: "California", abbr: "CA" },
  { city: "Newport Beach", state: "California", abbr: "CA" },
  { city: "Laguna Beach", state: "California", abbr: "CA" },
  { city: "Coronado", state: "California", abbr: "CA" },
  { city: "Montecito", state: "California", abbr: "CA" },
  { city: "Santa Barbara", state: "California", abbr: "CA" },
  { city: "Carmel", state: "California", abbr: "CA" },
  { city: "Napa", state: "California", abbr: "CA" },
  { city: "Tiburon", state: "California", abbr: "CA" },
  { city: "Ross", state: "California", abbr: "CA" },
  { city: "Rancho Santa Fe", state: "California", abbr: "CA" },
  { city: "Aspen", state: "Colorado", abbr: "CO" },
  { city: "Vail", state: "Colorado", abbr: "CO" },
  { city: "Telluride", state: "Colorado", abbr: "CO" },
  { city: "Steamboat Springs", state: "Colorado", abbr: "CO" },
  { city: "Denver", state: "Colorado", abbr: "CO" },
  { city: "Boulder", state: "Colorado", abbr: "CO" },
  { city: "Cherry Hills Village", state: "Colorado", abbr: "CO" },
  { city: "Chicago", state: "Illinois", abbr: "IL" },
  { city: "Winnetka", state: "Illinois", abbr: "IL" },
  { city: "Lake Forest", state: "Illinois", abbr: "IL" },
  { city: "Highland Park", state: "Illinois", abbr: "IL" },
  { city: "Naperville", state: "Illinois", abbr: "IL" },
  { city: "Hinsdale", state: "Illinois", abbr: "IL" },
  { city: "Boston", state: "Massachusetts", abbr: "MA" },
  { city: "Nantucket", state: "Massachusetts", abbr: "MA" },
  { city: "Martha's Vineyard", state: "Massachusetts", abbr: "MA" },
  { city: "Brookline", state: "Massachusetts", abbr: "MA" },
  { city: "Wellesley", state: "Massachusetts", abbr: "MA" },
  { city: "Concord", state: "Massachusetts", abbr: "MA" },
  { city: "Houston", state: "Texas", abbr: "TX" },
  { city: "Dallas", state: "Texas", abbr: "TX" },
  { city: "Austin", state: "Texas", abbr: "TX" },
  { city: "San Antonio", state: "Texas", abbr: "TX" },
  { city: "Highland Park", state: "Texas", abbr: "TX" },
  { city: "River Oaks", state: "Texas", abbr: "TX" },
  { city: "Seattle", state: "Washington", abbr: "WA" },
  { city: "Bellevue", state: "Washington", abbr: "WA" },
  { city: "Mercer Island", state: "Washington", abbr: "WA" },
  { city: "Medina", state: "Washington", abbr: "WA" },
  { city: "Scottsdale", state: "Arizona", abbr: "AZ" },
  { city: "Paradise Valley", state: "Arizona", abbr: "AZ" },
  { city: "Sedona", state: "Arizona", abbr: "AZ" },
  { city: "Phoenix", state: "Arizona", abbr: "AZ" },
  { city: "Tucson", state: "Arizona", abbr: "AZ" },
  { city: "Las Vegas", state: "Nevada", abbr: "NV" },
  { city: "Henderson", state: "Nevada", abbr: "NV" },
  { city: "Incline Village", state: "Nevada", abbr: "NV" },
  { city: "Reno", state: "Nevada", abbr: "NV" },
  { city: "Park City", state: "Utah", abbr: "UT" },
  { city: "Salt Lake City", state: "Utah", abbr: "UT" },
  { city: "Deer Valley", state: "Utah", abbr: "UT" },
  { city: "Honolulu", state: "Hawaii", abbr: "HI" },
  { city: "Maui", state: "Hawaii", abbr: "HI" },
  { city: "Kailua", state: "Hawaii", abbr: "HI" },
  { city: "Wailea", state: "Hawaii", abbr: "HI" },
  { city: "Washington", state: "District of Columbia", abbr: "DC" },
  { city: "Georgetown", state: "District of Columbia", abbr: "DC" },
  { city: "McLean", state: "Virginia", abbr: "VA" },
  { city: "Great Falls", state: "Virginia", abbr: "VA" },
  { city: "Charlottesville", state: "Virginia", abbr: "VA" },
  { city: "Virginia Beach", state: "Virginia", abbr: "VA" },
  { city: "Atlanta", state: "Georgia", abbr: "GA" },
  { city: "Buckhead", state: "Georgia", abbr: "GA" },
  { city: "Savannah", state: "Georgia", abbr: "GA" },
  { city: "Sea Island", state: "Georgia", abbr: "GA" },
  { city: "Nashville", state: "Tennessee", abbr: "TN" },
  { city: "Memphis", state: "Tennessee", abbr: "TN" },
  { city: "Charlotte", state: "North Carolina", abbr: "NC" },
  { city: "Asheville", state: "North Carolina", abbr: "NC" },
  { city: "Raleigh", state: "North Carolina", abbr: "NC" },
  { city: "Wilmington", state: "North Carolina", abbr: "NC" },
  { city: "Charleston", state: "South Carolina", abbr: "SC" },
  { city: "Hilton Head", state: "South Carolina", abbr: "SC" },
  { city: "Kiawah Island", state: "South Carolina", abbr: "SC" },
  { city: "Portland", state: "Oregon", abbr: "OR" },
  { city: "Bend", state: "Oregon", abbr: "OR" },
  { city: "Lake Oswego", state: "Oregon", abbr: "OR" },
  { city: "Minneapolis", state: "Minnesota", abbr: "MN" },
  { city: "Edina", state: "Minnesota", abbr: "MN" },
  { city: "Wayzata", state: "Minnesota", abbr: "MN" },
  { city: "Philadelphia", state: "Pennsylvania", abbr: "PA" },
  { city: "Gladwyne", state: "Pennsylvania", abbr: "PA" },
  { city: "Bryn Mawr", state: "Pennsylvania", abbr: "PA" },
  { city: "New Hope", state: "Pennsylvania", abbr: "PA" },
  { city: "Detroit", state: "Michigan", abbr: "MI" },
  { city: "Grosse Pointe", state: "Michigan", abbr: "MI" },
  { city: "Traverse City", state: "Michigan", abbr: "MI" },
  { city: "Harbor Springs", state: "Michigan", abbr: "MI" },
  { city: "New Orleans", state: "Louisiana", abbr: "LA" },
  { city: "Baton Rouge", state: "Louisiana", abbr: "LA" },
  { city: "Jackson Hole", state: "Wyoming", abbr: "WY" },
  { city: "Teton Village", state: "Wyoming", abbr: "WY" },
  { city: "Sun Valley", state: "Idaho", abbr: "ID" },
  { city: "Coeur d'Alene", state: "Idaho", abbr: "ID" },
  { city: "Boise", state: "Idaho", abbr: "ID" },
  { city: "Big Sky", state: "Montana", abbr: "MT" },
  { city: "Whitefish", state: "Montana", abbr: "MT" },
  { city: "Bozeman", state: "Montana", abbr: "MT" },
  { city: "Newport", state: "Rhode Island", abbr: "RI" },
  { city: "Providence", state: "Rhode Island", abbr: "RI" },
  { city: "Kennebunkport", state: "Maine", abbr: "ME" },
  { city: "Bar Harbor", state: "Maine", abbr: "ME" },
  { city: "Camden", state: "Maine", abbr: "ME" },
  { city: "Cape Cod", state: "Massachusetts", abbr: "MA" },
  { city: "Princeton", state: "New Jersey", abbr: "NJ" },
  { city: "Alpine", state: "New Jersey", abbr: "NJ" },
  { city: "Short Hills", state: "New Jersey", abbr: "NJ" },
  { city: "Rumson", state: "New Jersey", abbr: "NJ" },
  { city: "Cape May", state: "New Jersey", abbr: "NJ" },
  { city: "Bethesda", state: "Maryland", abbr: "MD" },
  { city: "Chevy Chase", state: "Maryland", abbr: "MD" },
  { city: "Annapolis", state: "Maryland", abbr: "MD" },
  { city: "Kansas City", state: "Missouri", abbr: "MO" },
  { city: "St. Louis", state: "Missouri", abbr: "MO" },
  { city: "Milwaukee", state: "Wisconsin", abbr: "WI" },
  { city: "Lake Geneva", state: "Wisconsin", abbr: "WI" },
  { city: "Door County", state: "Wisconsin", abbr: "WI" },
  { city: "Indianapolis", state: "Indiana", abbr: "IN" },
  { city: "Carmel", state: "Indiana", abbr: "IN" },
  { city: "Columbus", state: "Ohio", abbr: "OH" },
  { city: "Cleveland", state: "Ohio", abbr: "OH" },
  { city: "Cincinnati", state: "Ohio", abbr: "OH" },
  { city: "Oklahoma City", state: "Oklahoma", abbr: "OK" },
  { city: "Tulsa", state: "Oklahoma", abbr: "OK" },
  { city: "Birmingham", state: "Alabama", abbr: "AL" },
  { city: "Mountain Brook", state: "Alabama", abbr: "AL" },
  { city: "Santa Fe", state: "New Mexico", abbr: "NM" },
  { city: "Albuquerque", state: "New Mexico", abbr: "NM" },
  { city: "Anchorage", state: "Alaska", abbr: "AK" },
];

export { LUXURY_CITIES };

interface MarketAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (city: string, state: string) => void;
  placeholder?: string;
}

export function MarketAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
}: MarketAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (value.length < 2) return [];
    const lower = value.toLowerCase();
    return LUXURY_CITIES.filter(
      (c) =>
        c.city.toLowerCase().startsWith(lower) ||
        c.city.toLowerCase().includes(lower),
    ).slice(0, 8);
  }, [value]);

  const showDropdown = isOpen && suggestions.length > 0;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setIsOpen(true);
      setActiveIndex(-1);
    },
    [onChange],
  );

  const handleSelect = useCallback(
    (entry: (typeof LUXURY_CITIES)[0]) => {
      onSelect(entry.city, entry.state);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      } else if (e.key === "ArrowDown" && showDropdown) {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp" && showDropdown) {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeIndex >= 0 && showDropdown) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      }
    },
    [showDropdown, activeIndex, suggestions, handleSelect],
  );

  const handleBlur = useCallback(() => {
    // Delay to allow click on option to fire first
    setTimeout(() => setIsOpen(false), 150);
  }, []);

  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) setIsOpen(true);
  }, [suggestions.length]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listboxId : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-colors duration-[var(--duration-default)]"
      />
      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] max-h-60 overflow-auto"
        >
          {suggestions.map((entry, idx) => (
            <li
              key={`${entry.city}-${entry.abbr}`}
              id={`${listboxId}-option-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(entry);
              }}
              className={`px-3 py-2 cursor-pointer font-[family-name:var(--font-sans)] text-sm transition-colors duration-[var(--duration-fast)] ${
                idx === activeIndex
                  ? "bg-[var(--color-accent-light)] text-[var(--color-primary)]"
                  : "text-[var(--color-text)] hover:bg-[var(--color-background)]"
              }`}
            >
              {entry.city}, {entry.abbr}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
