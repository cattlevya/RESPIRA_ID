import React from 'react';
import { Save, RefreshCw, Loader2, CheckCircle, FileText, Pill, Calendar } from 'lucide-react';
import { Card } from '../../ui/Widgets';

const ClinicalAnalysis = ({ diagnosis, recommendation, saveStatus, onRestart }) => {
    return (
        <div className="space-y-6">
            {/* Clinical Reasoning */}
            <Card className="p-6 md:p-8 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center">
                    <div className="w-1 h-5 bg-blue-600 rounded-full mr-3"></div>
                    Analisis Klinis
                </h3>

                <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 leading-relaxed text-lg mb-6">
                        Sistem mendeteksi pola gejala yang signifikan mengarah pada <strong>{diagnosis}</strong>.
                        Kesimpulan ini ditarik berdasarkan korelasi antara durasi gejala, lokasi keluhan, dan faktor risiko yang Anda laporkan.
                    </p>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h4 className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide flex items-center">
                        <FileText className="w-3 h-3 mr-1.5" />
                        Rekomendasi Utama
                    </h4>
                    <p className="text-slate-800 font-medium text-lg italic leading-relaxed">
                        "{recommendation}"
                    </p>
                </div>
            </Card>

            {/* Medication Advice (Moved from Sidebar) */}
            <Card className="p-6 md:p-8 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center">
                    <Pill className="w-5 h-5 text-blue-600 mr-2" />
                    Saran Pengobatan
                </h3>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        <strong className="text-slate-700 block mb-1">Catatan Penting:</strong>
                        Jangan mengonsumsi antibiotik tanpa resep dokter. Gunakan obat pereda gejala yang dijual bebas jika diperlukan.
                    </p>
                </div>

                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Buat Janji Temu
                </button>
            </Card>

            {/* Save Status & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Save Status Indicator */}
                <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <Save className="w-5 h-5 text-slate-400 mr-3" />
                        <span className="text-sm text-slate-600 font-medium">Status Data</span>
                    </div>
                    <div>
                        {saveStatus === 'saving' ? (
                            <span className="flex items-center text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">
                                <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Menyimpan...
                            </span>
                        ) : saveStatus === 'saved' ? (
                            <span className="flex items-center text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                <CheckCircle className="w-3 h-3 mr-1.5" /> Tersimpan
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Menunggu...</span>
                        )}
                    </div>
                </div>

                {/* Restart Button */}
                <button
                    onClick={onRestart}
                    className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center group"
                >
                    <RefreshCw className="w-5 h-5 mr-2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    Diagnosa Ulang
                </button>
            </div>
        </div>
    );
};

export default ClinicalAnalysis;
