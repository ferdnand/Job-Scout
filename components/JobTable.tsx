
import React from 'react';
import { JobListing } from '../types';
import { ExternalLink, Building2, MapPin, Calendar, Globe } from 'lucide-react';

// lucide-react icons manually imported to avoid issues
const IconWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-block align-middle ${className}`}>{children}</span>
);

interface JobTableProps {
  jobs: JobListing[];
}

export const JobTable: React.FC<JobTableProps> = ({ jobs }) => {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
        <p className="text-slate-500 font-medium">No job listings found yet. Start the agent to begin scouting.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Details</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company & Location</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</span>
                  <div className="flex items-center mt-1 text-slate-400 text-sm">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    <span>{job.datePublished || 'Recent'}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center text-slate-700">
                    <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="font-medium text-sm">{job.company}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{job.location}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center text-slate-500 text-sm">
                  <Globe className="w-4 h-4 mr-2 text-slate-400" />
                  <span>{job.source}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <a 
                  href={job.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
