'use client';

import { ProjectSortOptions } from '@/types/ecosystem';
import { Select } from '@/components/ui/Select';

interface ProjectSortProps {
  currentSort: ProjectSortOptions;
  onChange: (sort: ProjectSortOptions) => void;
}

type SortField = ProjectSortOptions['field'];
type SortDirection = ProjectSortOptions['direction'];

const sortOptions: Array<{ value: SortField; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'tvl', label: 'TVL' },
  { value: 'dailyActiveUsers', label: 'Active Users' },
  { value: 'launchDate', label: 'Launch Date' },
  { value: 'marketCap', label: 'Market Cap' }
];

const directionOptions: Array<{ value: SortDirection; label: string }> = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' }
];

export function ProjectSort({ currentSort, onChange }: ProjectSortProps) {
  return (
    <div className="flex gap-2">
      <Select
        value={currentSort.field}
        onValueChange={(value) => 
          onChange({ ...currentSort, field: value as SortField })
        }
        items={sortOptions}
      />
      <Select
        value={currentSort.direction}
        onValueChange={(value) => 
          onChange({ ...currentSort, direction: value as SortDirection })
        }
        items={directionOptions}
      />
    </div>
  );
} 