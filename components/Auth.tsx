
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, Lock, Loader2, Search, ArrowRight, CheckCircle2, Chrome } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
  initialVerificationEmail?: string | null;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, initialVerificationEmail }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(initialVerificationEmail || null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // Check if user document exists, if not create it
        const userDocRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: result.user.email,
            displayName: result.user.displayName,
            plan: 'free',
            createdAt: serverTimestamp(),
            searchCount: 0,
            downloadCount: 0,
            emailCount: 0
          });
        }
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          displayName: '',
          plan: 'free',
          createdAt: serverTimestamp(),
          searchCount: 0,
          downloadCount: 0,
          emailCount: 0
        });

        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setVerificationEmail(email);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          const userEmail = userCredential.user.email;
          await signOut(auth);
          setVerificationEmail(userEmail);
          return;
        }
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      if (isSignUp && err.code === 'auth/email-already-in-use') {
        setError("User already exists. Please sign in");
      } else if (!isSignUp && (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password')) {
        setError("Email or password is incorrect");
      } else {
        setError(err.message || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center">
            <div className="bg-emerald-50 p-4 rounded-2xl mb-6 inline-block">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Verify your email</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              We have sent you a verification email to <span className="font-bold text-slate-900">{verificationEmail}</span>. Please verify it and log in.
            </p>
            <button
              onClick={() => {
                setVerificationEmail(null);
                setIsSignUp(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-200">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              MEL Kenya <span className="text-blue-600">Job Scout</span>
            </h1>
            <p className="text-slate-500 text-sm mt-2 text-center">
              {isSignUp ? 'Create an account to start scouting' : 'Sign in to access your dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center">
            <div className="flex-1 h-[1px] bg-slate-100"></div>
            <span className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-[1px] bg-slate-100"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center space-x-3 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
          >
            <Chrome className="w-5 h-5 text-blue-600" />
            <span>Continue with Google</span>
          </button>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
