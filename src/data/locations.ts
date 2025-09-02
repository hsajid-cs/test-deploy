// Minimal country -> cities dataset. Extend as needed.
export const countries: string[] = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'India'
];

export const citiesByCountry: Record<string, string[]> = {
  'United States': ['New York', 'San Francisco', 'Austin', 'Chicago', 'Seattle'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  'India': ['Bengaluru', 'Mumbai', 'Hyderabad', 'Delhi', 'Chennai']
};
