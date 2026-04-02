
import { JobListing } from '../types';

export const generateCSV = (jobs: JobListing[]): string => {
  const headers = ['Job Title', 'Company Name', 'Location', 'Source Site', 'Job Link', 'Date Published'];
  const rows = jobs.map(job => [
    `"${job.title.replace(/"/g, '""')}"`,
    `"${job.company.replace(/"/g, '""')}"`,
    `"${job.location.replace(/"/g, '""')}"`,
    `"${job.source.replace(/"/g, '""')}"`,
    `"${job.link}"`,
    `"${job.datePublished}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
