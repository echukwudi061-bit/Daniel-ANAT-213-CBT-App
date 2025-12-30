import React, { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle, Trash2, LogOut, Upload } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyyG8ELDWDzWfyxhZBggRoIQ4taDIO-nk",
  authDomain: "danielo-s-project-524d0.firebaseapp.com",
  projectId: "danielo-s-project-524d0",
  storageBucket: "danielo-s-project-524d0.firebasestorage.app",
  messagingSenderId: "728041872480",
  appId: "1:728041872480:web:49fbba681bb32aa22eb705"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "anatomy-cbt-v1";

type OptionKey = 'optionA' | 'optionB' | 'optionC' | 'optionD';
interface Question { id: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: OptionKey; }

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'welcome' | 'test' | 'result' | 'admin'>('welcome');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubData = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'questions'), (snap) => {
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
      setIsLoading(false); // Stop loading once it tries to fetch
    }, (error) => {
      console.error(error);
      setIsLoading(false); // Stop loading even if there is an error
    });
    return () => unsubData();
  }, [user]);

  const handleSubmit = () => {
    let finalScore = 0;
    questions.forEach(q => { if (answers[q.id] === q.correctAnswer) finalScore += 2; });
    setScore(finalScore);
    setView('result');
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-bold">Connecting to CBT...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      {view === 'welcome' && (
        <div className="m-auto text-center bg-white p-8 rounded-xl shadow-lg border max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-4 text-blue-600">DANIEL'S ANATOMY CBT</h1>
          <p className="text-sm text-gray-500 mb-6 uppercase">ANAT 213: Embryo & Genetics</p>
          <button onClick={() => setView('test')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md active:scale-95 transition-transform">Start Test</button>
          <div className="mt-8 pt-4 border-t">
            <button onClick={() => {
               const pass = prompt("Enter Admin Password:");
               if(pass === "BrainyBlessing08148800047") { setIsAdmin(true); setView('admin'); }
            }} className="text-xs text-gray-400">Admin Login</button>
          </div>
        </div>
      )}

      {view === 'test' && (
        <div className="max-w-xl m-auto w-full bg-white p-6 rounded-xl shadow">
          {questions.length > 0 ? (
            <>
              <div className="flex justify-between mb-4 border-b pb-2">
                <span className="font-bold text-blue-600">Question {currentQIndex + 1} / {questions.length}</span>
              </div>
              <p className="mb-6 font-medium text-lg">{questions[currentQIndex]?.text}</p>
              <div className="space-y-2">
                {['optionA', 'optionB', 'optionC', 'optionD'].map((opt) => (
                  <button key={opt} onClick={() => setAnswers({...answers, [questions[currentQIndex].id]: opt as OptionKey})} 
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[questions[currentQIndex].id] === opt ? 'bg-blue-50 border-blue-500 font-bold' : 'border-gray-100'}`}>
                    {questions[currentQIndex][opt as OptionKey]}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 pt-4 border-t">
                <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)} className="text-gray-500 font-bold">Prev</button>
                {currentQIndex === questions.length - 1 ? 
                  <button onClick={handleSubmit} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold shadow-md">Submit Test</button> : 
                  <button onClick={() => setCurrentQIndex(prev => prev + 1)} className="text-blue-600 font-bold">Next</button>
                }
              </div>
            </>
          ) : (
            <div className="text-center p-10">
              <p className="text-red-500 font-bold mb-4">No questions found in database.</p>
              <button onClick={() => setView('welcome')} className="text-blue-600 underline">Go Back</button>
            </div>
          )}
        </div>
      )}

      {view === 'result' && (
        <div className="m-auto text-center bg-white p-10 rounded-2xl shadow-xl border">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Test Completed</h2>
          <p className="text-gray-500 mb-6">Your Total Score:</p>
          <div className="text-6xl font-black text-blue-600 mb-8">{score}</div>
          <button onClick={() => setView('welcome')} className="bg-gray-800 text-white px-8 py-3 rounded-xl font-bold">Restart</button>
        </div>
      )}

      {view === 'admin' && (
        <div className="max-w-2xl m-auto w-full bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="font-bold text-xl">Admin Panel ({questions.length} Questions)</h2>
            <button onClick={() => setView('welcome')} className="p-2 hover:bg-gray-100 rounded-full"><LogOut className="w-5 h-5 text-red-500"/></button>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
             <p className="text-sm font-bold text-blue-800 mb-2">Instructions:</p>
             <p className="text-xs text-blue-600">You must use the Firebase Console to upload questions in bulk or use the specialized CSV upload tool.</p>
          </div>

          <div className="divide-y overflow-y-auto max-h-[400px]">
            {questions.map((q, idx) => (
              <div key={q.id} className="py-3 flex justify-between items-center text-sm">
                <span className="truncate mr-4">{idx + 1}. {q.text}</span>
                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'questions', q.id))} className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500"/></button>
              </div>
            ))}
            {questions.length === 0 && <p className="text-center py-10 text-gray-400">Question bank is empty.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
