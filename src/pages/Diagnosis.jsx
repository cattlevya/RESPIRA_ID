import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { decisionTree } from '../data/decisionTree';
import { ImageGrid, AudioPlayer } from '../components/ui/MultimediaCards';
import { AlertTriangle, CheckCircle, ArrowRight, RefreshCw, ChevronLeft, Save, Loader2, Stethoscope } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DiagnosisHeaderCard from '../components/diagnosis/result/DiagnosisHeaderCard';
import ClinicalAnalysis from '../components/diagnosis/result/ClinicalAnalysis';
import ActionPlanSidebar from '../components/diagnosis/result/ActionPlanSidebar';

// Placeholder for the requested asset since file generation is quota-limited
// In a real scenario, we would import the file: import neuralLungImage from '../assets/images/neural-lungs-diagnostic.png';
const neuralLungImage = "https://placehold.co/800x400/0f172a/06b6d4?text=Neural+Lungs+Diagnostic+Imaging&font=roboto";

const Diagnosis = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState(['start']);
    const [currentNodeId, setCurrentNodeId] = useState('start');
    const [answers, setAnswers] = useState({});
    const [selectedOption, setSelectedOption] = useState(null);

    // Save State
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saved, error
    const hasSavedRef = useRef(false); // Ref to prevent double save in StrictMode

    const currentNode = decisionTree.find(n => n.id === currentNodeId);

    // Scroll to top on node change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setSelectedOption(null);
    }, [currentNodeId]);

    // Auto-Save Logic when Result is reached
    useEffect(() => {
        const saveResult = async () => {
            if (currentNode?.type === 'result' && user?.id && !hasSavedRef.current) {
                hasSavedRef.current = true; // Mark as saved immediately
                setIsSaving(true);

                // Prepare data
                const diagnosisData = {
                    userId: user.id,
                    result: currentNode.diagnosis,
                    score: currentNode.confidence || (currentNode.severity === 'critical' ? 90 : 75),
                    symptoms: answers // Save the path taken
                };

                const res = await api.saveDiagnosis(diagnosisData);
                if (res.success) {
                    setSaveStatus('saved');
                } else {
                    setSaveStatus('error');
                    hasSavedRef.current = false; // Allow retry if failed
                }
                setIsSaving(false);
            }
        };

        saveResult();
    }, [currentNode, user, answers]);

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
    };

    const handleNext = () => {
        if (!selectedOption) return;

        // Save answer
        setAnswers(prev => ({ ...prev, [currentNodeId]: selectedOption }));

        // Navigate
        if (selectedOption.next) {
            setHistory(prev => [...prev, selectedOption.next]);
            setCurrentNodeId(selectedOption.next);
        }
    };

    const handleBack = () => {
        if (history.length <= 1) return;
        const newHistory = [...history];
        newHistory.pop();
        const prevNodeId = newHistory[newHistory.length - 1];
        setHistory(newHistory);
        setCurrentNodeId(prevNodeId);
        setSelectedOption(null);
        hasSavedRef.current = false; // Reset save flag if going back
        setSaveStatus('idle');
    };

    const handleRestart = () => {
        setHistory(['start']);
        setCurrentNodeId('start');
        setAnswers({});
        setSelectedOption(null);
        hasSavedRef.current = false;
        setSaveStatus('idle');
    };

    if (!currentNode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Data Error</h2>
                <p className="text-slate-500 mt-2">
                    Node diagnosa ID <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-red-600">{currentNodeId}</code> tidak ditemukan.
                </p>
                <p className="text-sm text-slate-400 mt-1">Mohon laporkan ke admin sistem.</p>
                <button onClick={handleRestart} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Mulai Ulang
                </button>
            </div>
        );
    }

    const isResult = currentNode.type === 'result';

    return (
        <div className="max-w-7xl mx-auto pb-24 px-4 md:px-8">
            {/* Progress Bar */}
            {!isResult && (
                <div className="mb-8">
                    <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                        <span>Analisa Medis</span>
                        <span>Tahap {history.length}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(history.length * 10, 100)}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            )}

            {/* Result Header (Full Width) */}
            {isResult && (
                <div className="mb-8">
                    <DiagnosisHeaderCard
                        diagnosis={currentNode.diagnosis}
                        severity={currentNode.severity}
                        confidence={currentNode.confidence} // Real data from Decision Tree
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Column (8/12) */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentNodeId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                        >
                            {/* Header Image Logic (Only for Questions) */}
                            {!isResult && (currentNode.image || currentNodeId === 'start') && (
                                <div className="h-64 bg-slate-900 relative overflow-hidden">
                                    <img
                                        src={currentNode.image || neuralLungImage}
                                        alt="Visual Aid"
                                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700"
                                        onError={(e) => {
                                            if (e.target.src !== neuralLungImage) {
                                                e.target.src = neuralLungImage;
                                            } else {
                                                e.target.style.display = 'none';
                                            }
                                        }}
                                    />
                                    {currentNode.type === 'danger_check' && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex items-end p-8">
                                            <span className="text-white font-bold text-lg flex items-center shadow-sm">
                                                <AlertTriangle className="w-6 h-6 mr-3 text-yellow-400 animate-pulse" />
                                                Periksa Tanda Klinis Ini
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={isResult ? "p-0" : "p-6 md:p-8"}>
                                {isResult ? (
                                    <ClinicalAnalysis
                                        diagnosis={currentNode.diagnosis}
                                        recommendation={currentNode.recommendation}
                                        saveStatus={saveStatus}
                                        onRestart={handleRestart}
                                    />
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-3">{currentNode.question}</h2>
                                        {currentNode.description && (
                                            <p className="text-slate-500 mb-8 text-lg leading-relaxed">{currentNode.description}</p>
                                        )}

                                        {/* Options Rendering */}
                                        <div className="space-y-4">
                                            {currentNode.type === 'image_selection' ? (
                                                <ImageGrid
                                                    options={currentNode.options}
                                                    selectedValue={selectedOption?.value}
                                                    onSelect={handleOptionSelect}
                                                />
                                            ) : currentNode.type === 'audio_selection' ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {currentNode.options.map(opt => (
                                                        <AudioPlayer
                                                            key={opt.value}
                                                            src={opt.audio}
                                                            label={opt.label}
                                                            isSelected={selectedOption?.value === opt.value}
                                                            onSelect={() => handleOptionSelect(opt)}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {currentNode.options.map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => handleOptionSelect(opt)}
                                                            className={clsx(
                                                                "w-full text-left p-5 rounded-xl border-2 transition-all flex items-center justify-between group",
                                                                selectedOption?.value === opt.value
                                                                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-md"
                                                                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm"
                                                            )}
                                                        >
                                                            <span className={clsx(
                                                                "font-medium text-lg",
                                                                selectedOption?.value === opt.value ? "text-blue-700" : "text-slate-700"
                                                            )}>{opt.label}</span>
                                                            {selectedOption?.value === opt.value && (
                                                                <CheckCircle className="w-6 h-6 text-blue-600" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Navigation Actions */}
                                        <div className="mt-10 flex items-center justify-between pt-8 border-t border-slate-100">
                                            <button
                                                onClick={handleBack}
                                                disabled={history.length <= 1}
                                                className="px-5 py-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 font-medium flex items-center transition-colors hover:bg-slate-100 rounded-lg"
                                            >
                                                <ChevronLeft className="w-5 h-5 mr-1" />
                                                Kembali
                                            </button>

                                            <button
                                                onClick={handleNext}
                                                disabled={!selectedOption}
                                                className={clsx(
                                                    "px-8 py-3.5 rounded-xl font-bold flex items-center transition-all",
                                                    selectedOption
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transform hover:-translate-y-0.5"
                                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                )}
                                            >
                                                Lanjut
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Sidebar Column (4/12) */}
                <div className="lg:col-span-4 space-y-6">
                    {isResult ? (
                        <ActionPlanSidebar severity={currentNode.severity} />
                    ) : (
                        <>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                                    <div className="w-2 h-6 bg-teal-500 rounded-full mr-3" />
                                    Panduan Pasien
                                </h3>
                                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                                    <p>Jawablah setiap pertanyaan sesuai dengan kondisi yang Anda rasakan saat ini.</p>
                                    <p>Untuk pemeriksaan suara napas, Anda bisa meminta bantuan kerabat untuk mendengarkan pada area punggung.</p>
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-800 text-xs font-medium mt-4">
                                        💡 Tips: Jika ragu, pilih gejala yang paling dominan atau mendekati.
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
                                <h3 className="font-semibold mb-2">Riwayat Sementara</h3>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    {history.slice(1).map((nodeId, idx) => {
                                        return (
                                            <li key={idx} className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                                <span>Tahap {idx + 1} Selesai</span>
                                            </li>
                                        );
                                    })}
                                    {history.length === 1 && <li className="italic opacity-50">Belum ada data</li>}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const ActivityIcon = ({ severity }) => {
    if (severity === 'critical') return <AlertTriangle className="w-12 h-12" />;
    if (severity === 'high') return <AlertTriangle className="w-12 h-12" />;
    return <CheckCircle className="w-12 h-12" />;
};

export default Diagnosis;
