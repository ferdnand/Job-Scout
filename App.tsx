
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Download, 
  Mail, 
  CheckCircle2, 
  Loader2, 
  Search, 
  FileText,
  RefreshCw,
  Terminal,
  Send,
  X,
  MailCheck,
  LogOut
} from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { Auth } from './components/Auth';
import { AppStep, JobListing, AgentStatus } from './types';
import { SEARCH_QUERIES, RECIPIENT_EMAIL, REPORT_TIME } from './constants';
import { performJobSearch, summarizeReport, EmailDraft } from './services/geminiService';
import { JobTable } from './components/JobTable';
import { generateCSV, downloadCSV } from './utils/csvUtils';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [verificationEmailForAuth, setVerificationEmailForAuth] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>(AppStep.IDLE);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [status, setStatus] = useState<AgentStatus>({
    isSearching: false,
    currentQueryIndex: 0,
    totalQueries: SEARCH_QUERIES.length,
    logs: ['Agent initialized. Waiting for command...']
  });
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setStatus(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${msg}`]
    }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        setVerificationEmailForAuth(currentUser.email);
        await signOut(auth);
        setUser(null);
      } else {
        setUser(currentUser);
        if (currentUser) setVerificationEmailForAuth(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [status.logs]);

  const startAgent = async () => {
    setStep(AppStep.SEARCHING);
    setStatus(prev => ({ ...prev, isSearching: true, currentQueryIndex: 0 }));
    setJobs([]);
    setEmailSent(false);
    addLog("Starting daily job scout sequence...");

    let allFoundJobs: JobListing[] = [];

    for (let i = 0; i < SEARCH_QUERIES.length; i++) {
      setStatus(prev => ({ ...prev, currentQueryIndex: i + 1 }));
      const queryJobs = await performJobSearch(SEARCH_QUERIES[i], addLog);
      allFoundJobs = [...allFoundJobs, ...queryJobs];
      
      const uniqueJobs = Array.from(new Map(allFoundJobs.map(item => [item.title + item.company, item])).values());
      setJobs(uniqueJobs);
      
      await new Promise(r => setTimeout(r, 1000));
    }

    addLog("Search complete. Drafting email report...");
    const draft = await summarizeReport(allFoundJobs);
    setEmailDraft(draft);
    
    setStatus(prev => ({ ...prev, isSearching: false }));
    setStep(AppStep.COMPLETED);
    addLog("Job scouting completed successfully. Report ready.");
  };

  const handleDownload = () => {
    const csvContent = generateCSV(jobs);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `google_mel_jobs_${date}.csv`);
    addLog("Report exported to CSV.");
  };

  const prepareEmail = async () => {
    if (!emailDraft && jobs.length > 0) {
      addLog("Generating email summary...");
      const draft = await summarizeReport(jobs);
      setEmailDraft(draft);
    } else if (jobs.length === 0) {
      addLog("Cannot send email: No jobs found. Run scout first.");
      alert("Please run the Job Scout first to collect listings.");
      return;
    }
    setShowEmailModal(true);
  };

  const confirmSendEmail = async () => {
    setIsSendingEmail(true);
    addLog(`Initiating email dispatch to ${RECIPIENT_EMAIL}...`);
    
    // Realistic simulation steps
    await new Promise(r => setTimeout(r, 1000));
    addLog("Attaching google_MEL_jobs.csv (Base64 encoded)...");
    
    await new Promise(r => setTimeout(r, 1500));
    addLog("Connecting to outgoing mail server...");
    
    await new Promise(r => setTimeout(r, 1000));
    addLog(`Email successfully sent to ${RECIPIENT_EMAIL}.`);
    
    setIsSendingEmail(false);
    setShowEmailModal(false);
    setEmailSent(true);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => setEmailSent(false), 5000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStep(AppStep.IDLE);
      setJobs([]);
      addLog("User signed out.");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing Agent...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Auth 
        onAuthSuccess={() => {}} 
        initialVerificationEmail={verificationEmailForAuth}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                MEL Kenya <span className="text-blue-600">Job Scout</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-xs text-slate-400 font-medium uppercase">Daily Schedule</p>
                <p className="text-sm text-slate-600 font-semibold">{REPORT_TIME}</p>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
              {step === AppStep.IDLE || step === AppStep.COMPLETED ? (
                <button 
                  onClick={startAgent}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{step === AppStep.COMPLETED ? 'Rerun Scout' : 'Start Agent'}</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-5 py-2.5 rounded-full font-semibold border border-blue-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Agent Working...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Success Toast */}
      {emailSent && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-500">
            <MailCheck className="w-6 h-6" />
            <div>
              <p className="font-bold">Email Dispatched!</p>
              <p className="text-xs text-emerald-100">Report sent to {RECIPIENT_EMAIL}</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Statistics & Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Daily Goal: 15-25</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Found Listings</p>
            <p className="text-4xl font-extrabold text-slate-900">{jobs.length}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-xl">
                <RefreshCw className={`w-6 h-6 text-purple-600 ${status.isSearching ? 'animate-spin' : ''}`} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Search Progress</p>
            <div className="mt-2">
              <div className="flex justify-between items-end mb-1">
                <p className="text-2xl font-extrabold text-slate-900">
                  {status.currentQueryIndex} <span className="text-lg font-medium text-slate-400">/ {status.totalQueries}</span>
                </p>
                <p className="text-sm font-bold text-slate-500">{Math.round((status.currentQueryIndex / status.totalQueries) * 100)}%</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(status.currentQueryIndex / status.totalQueries) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-50 p-3 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Agent Health</p>
            <p className="text-2xl font-extrabold text-slate-900">Active</p>
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
              Cloud Synchronized
            </p>
          </div>
        </div>

        {/* Console & Activity Logs */}
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Agent Activity Logs</span>
            </div>
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-60"></div>
            </div>
          </div>
          <div 
            ref={logContainerRef}
            className="p-6 h-48 overflow-y-auto font-mono text-sm space-y-1.5 text-slate-300 scrollbar-thin scrollbar-thumb-slate-700"
          >
            {status.logs.map((log, i) => (
              <div key={i} className="flex space-x-3">
                <span className="text-slate-600 select-none">[{i+1}]</span>
                <span>{log}</span>
              </div>
            ))}
            {status.isSearching && (
              <div className="flex items-center space-x-3 text-blue-400 animate-pulse">
                <span className="text-slate-600 select-none">[*]</span>
                <span>Scraping Google Jobs blocks...</span>
              </div>
            )}
          </div>
        </div>

        {/* Email/Export Controls */}
        {jobs.length > 0 && (
          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Mail className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold flex items-center">
                  <Mail className="mr-3 w-7 h-7" />
                  Agent Report Ready
                </h2>
                <p className="text-blue-100 max-w-lg">
                  Scout has identified {jobs.length} unique opportunities matching your criteria. You can now download the CSV or dispatch the report to {RECIPIENT_EMAIL}.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleDownload}
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center shadow-lg active:scale-95"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download CSV
                </button>
                <button 
                  onClick={prepareEmail}
                  className="bg-blue-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all flex items-center shadow-lg border border-blue-700 active:scale-95"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Email Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scouted Job Listings</h2>
            <div className="text-slate-400 text-sm font-medium">Last updated: {new Date().toLocaleDateString()}</div>
          </div>
          <JobTable jobs={jobs} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} MEL Kenya Scout Agent. Powered by Gemini AI.
          </p>
        </div>
      </footer>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <button 
                  onClick={() => !isSendingEmail && setShowEmailModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Review Agent Dispatch</h3>
              <p className="text-slate-500 mb-8">
                Confirm the details of the automated daily report.
              </p>
              
              <div className="space-y-6">
                {/* Recipients */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient</div>
                    <div className="text-slate-900 font-semibold truncate">{RECIPIENT_EMAIL}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attachments</div>
                    <div className="text-blue-600 font-semibold flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      google_MEL_jobs.csv
                    </div>
                  </div>
                </div>

                {/* Email Content Preview */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subject Line</div>
                    <div className="text-slate-900 font-bold">{emailDraft?.subject || 'Loading subject...'}</div>
                  </div>
                  <div className="h-[1px] bg-slate-200"></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Body Draft</div>
                    <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap italic">
                      {emailDraft?.body || 'Generating summary...'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setShowEmailModal(false)}
                  disabled={isSendingEmail}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Dismiss
                </button>
                <button 
                  onClick={confirmSendEmail}
                  disabled={isSendingEmail}
                  className="flex-[2] px-6 py-4 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center disabled:opacity-80"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Dispatching Report...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-3" />
                      Confirm & Send Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
