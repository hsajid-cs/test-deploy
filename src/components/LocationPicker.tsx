import React, { useState, useEffect, useMemo } from 'react';
import { Country, City, State } from 'country-state-city';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  value: string; // stored as "City, State, Country" | "City, Country" | "State, Country" | 'Country'
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

// Parse stored value into city + state + country (lenient/backwards compatible)
function parseLocation(value: string): { city: string; state: string; country: string } {
  if (!value) return { city: '', state: '', country: '' };
  const parts = value.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 3) {
    return { city: parts[0], state: parts[1], country: parts[2] };
  }
  if (parts.length === 2) {
    const [maybeCityOrState, maybeCountry] = parts;
    // Determine if first token is a state of the country; if so treat it as state (legacy state+country format)
    const countryIso = Country.getAllCountries().find(c=>c.name===maybeCountry)?.isoCode;
    if (countryIso) {
      const states = State.getStatesOfCountry(countryIso) || [];
      if (states.some(s=>s.name===maybeCityOrState)) {
        return { city: '', state: maybeCityOrState, country: maybeCountry };
      }
    }
    // Otherwise treat as city
    return { city: maybeCityOrState, state: '', country: maybeCountry };
  }
  if (parts.length === 1) return { city: '', state: '', country: parts[0] };
  return { city: '', state: '', country: '' };
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, label = 'Location', className, disabled }) => {
  const { city: initialCity, state: initialState, country: initialCountry } = parseLocation(value);
  const [country, setCountry] = useState(initialCountry);
  const [state, setState] = useState(initialState);
  const [city, setCity] = useState(initialCity);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // sync external value updates
    const { city: c, state: s, country: co } = parseLocation(value);
    setCity(c);
    setState(s);
    setCountry(co);
    // If legacy format (city,country) and country has states but no state saved, try to infer state from city
    if (co && c && !s) {
      const iso = allCountries.find(ct=>ct.name===co)?.isoCode;
      if (iso) {
        const states = State.getStatesOfCountry(iso) || [];
        if (states.length) {
          for (const st of states) {
            const stIso = st.isoCode;
            const cities = City.getCitiesOfState(iso, stIso) || [];
            if (cities.some(ci => ci.name.toLowerCase() === c.toLowerCase())) {
              setState(st.name);
              break;
            }
          }
        }
      }
    }
  }, [value]);

  const handleSelectCountry = (c: string) => {
    setCountry(c);
    // Reset state + city whenever country changes
    setState('');
    setCity('');
    // Update external value to only country (no state/city yet)
    onChange(c);
  };
  const handleSelectState = (st: string) => {
    setState(st);
    // Reset city when state changes
    setCity('');
    const val = st ? `${st}, ${country}` : country; // interim value
    onChange(val);
  };
  const handleSelectCity = (ct: string) => {
    setCity(ct);
    let val = '';
    if (ct && state && country) val = `${ct}, ${state}, ${country}`;
    else if (ct && country) val = `${ct}, ${country}`; // legacy style if no state selected
    else if (state && country) val = `${state}, ${country}`;
    else val = country;
    onChange(val);
    setOpen(false);
  };

  // Display logic: only country if city not chosen
  const triggerLabel = (() => {
    if (city && state && country) return `${city}, ${state}, ${country}`;
    if (city && country) return `${city}, ${country}`; // no state selected
    if (state && country) return `${state}, ${country}`;
    if (country) return country;
    return label;
  })();
  const allCountries = useMemo(()=>Country.getAllCountries(), []);
  const countryStates = useMemo(()=>{
    if (!country) return [] as string[];
    const iso = allCountries.find(c=>c.name===country)?.isoCode;
    if (!iso) return [] as string[];
    const states = State.getStatesOfCountry(iso) || [];
    return states.map(s=>s.name);
  }, [country, allCountries]);
  const countryCities = useMemo(()=>{
    if (!country) return [] as string[];
    const countryIso = allCountries.find(c=>c.name===country)?.isoCode;
    if (!countryIso) return [] as string[];
    const hasStates = (State.getStatesOfCountry(countryIso) || []).length > 0;
    // If the country has states, require a state selection before listing cities
    if (hasStates) {
      if (!state) return [] as string[];
      const stateIso = (State.getStatesOfCountry(countryIso) || []).find(s=>s.name===state)?.isoCode;
      if (stateIso) {
        return (City.getCitiesOfState(countryIso, stateIso) || []).map(c=>c.name);
      }
      return [] as string[];
    }
    // Countries without states: list all cities directly
    return (City.getCitiesOfCountry(countryIso) || []).map(c=>c.name);
  }, [country, state, allCountries]);

  const body = (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Country</label>
        <select
          className="w-full border rounded-md px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={country}
          onChange={(e)=>handleSelectCountry(e.target.value)}
        >
          <option value="">Select country...</option>
          {allCountries.map(c => (
            <option key={c.isoCode} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>
      {countryStates.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">State / Province</label>
          <select
            className="w-full border rounded-md px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            value={state}
            onChange={(e)=>handleSelectState(e.target.value)}
            disabled={!country}
          >
            <option value="">{country ? 'Select state...' : 'Select country first'}</option>
            {countryStates.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">City</label>
        <select
          className="w-full border rounded-md px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          value={city}
          onChange={(e)=>handleSelectCity(e.target.value)}
          disabled={!country || (countryStates.length > 0 && !state)}
        >
          <option value="">{
            !country
              ? 'Select country first'
              : (countryStates.length > 0 && !state)
                ? 'Select state first'
                : (countryCities.length ? 'Select city...' : 'No cities found')
          }</option>
          {countryCities.map(ct => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'italic text-muted-foreground hover:text-foreground transition px-1 py-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
  (!country && !state && !city) && 'opacity-70',
        className
      )}
      onClick={()=>setOpen(o=>!o)}
    >
      {triggerLabel}
    </button>
  );

  // No special focus logic needed for native selects

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="h-1/2 p-4 space-y-4">
          <div className="text-sm font-medium">Select Location</div>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="text-sm font-medium mb-2">Select Location</div>
        {body}
      </PopoverContent>
    </Popover>
  );
};

// Simplified dropdown implementation (keyboard accessibility via native <select>)

