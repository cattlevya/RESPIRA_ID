import React, { useState, useEffect } from 'react';
import { History, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Riwayat = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (user?.id) {
                try {
                    const response = await api.getHistory(user.id);
                    if (response.success && Array.isArray(response.data)) {
                        // Sort by date descending
                        const sortedHistory = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        setHistory(sortedHistory);
                    }
                } catch (error) {
                    console.error("Failed to fetch history:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="p-3 bg-indigo-50 rounded-xl mr-4">
                        <History className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Riwayat Diagnosa</h1>
                        <p className="text-slate-500">Rekam jejak pemeriksaan kesehatan Anda.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {history.length > 0 ? (
                    history.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow"
                        >
                            <div className="mb-4 md:mb-0">
                                <div className="flex items-center text-sm text-slate-400 mb-2">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">{item.final_result}</h3>
                                <div className="text-slate-600 text-sm mt-1 max-w-2xl">
                                    <span className="font-medium">Gejala: </span>
                                    {(() => {
                                        try {
                                            const symptoms = item.symptoms_summary ? JSON.parse(item.symptoms_summary) : {};
                                            return `${Object.keys(symptoms).length} gejala terdeteksi`;
                                        } catch (e) {
                                            return "0 gejala terdeteksi";
                                        }
                                    })()}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.confidence_score >= 80 ? 'bg-red-100 text-red-700' :
                                        item.confidence_score >= 50 ? 'bg-orange-100 text-orange-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>
                                    Score: {item.confidence_score}%
                                </span>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
                        <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Belum ada riwayat</h3>
                        <p className="text-slate-500 mb-6">Lakukan diagnosa pertama Anda sekarang.</p>
                        <a href="/diagnosa" className="inline-flex items-center text-blue-600 font-medium hover:underline">
                            Mulai Diagnosa <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Riwayat;
