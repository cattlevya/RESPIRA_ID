import React, { useState } from 'react';
import { Calendar, Clock, User, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const doctors = [
    { id: 1, name: 'Dr. Antigravity, Sp.P', spec: 'Spesialis Paru', available: true },
    { id: 2, name: 'Dr. Sarah Johnson, Sp.PD', spec: 'Penyakit Dalam', available: true },
    { id: 3, name: 'Dr. Budi Santoso, Sp.A', spec: 'Spesialis Anak', available: false },
];

const Konsultasi = () => {
    const [formData, setFormData] = useState({
        doctor: '',
        date: '',
        time: '',
        complaint: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => {
            setShowSuccess(true);
            setFormData({ doctor: '', date: '', time: '', complaint: '' });
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center mb-6">
                    <div className="p-3 bg-teal-50 rounded-xl mr-4">
                        <Calendar className="w-8 h-8 text-teal-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Jadwal Konsultasi</h1>
                        <p className="text-slate-500">Buat janji temu dengan dokter spesialis kami.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Dokter</label>
                            <div className="space-y-3">
                                {doctors.map((doc) => (
                                    <label
                                        key={doc.id}
                                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.doctor === doc.name
                                                ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                                                : 'border-slate-200 hover:border-slate-300'
                                            } ${!doc.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="doctor"
                                            value={doc.name}
                                            disabled={!doc.available}
                                            onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                                            className="sr-only"
                                        />
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-4 text-slate-600 font-bold">
                                            {doc.name.charAt(4)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{doc.name}</div>
                                            <div className="text-xs text-slate-500">{doc.spec}</div>
                                        </div>
                                        {!doc.available && (
                                            <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">Penuh</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal & Waktu</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                                        <input
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Keluhan Utama</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                    <textarea
                                        required
                                        rows="4"
                                        value={formData.complaint}
                                        onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                                        placeholder="Jelaskan gejala yang Anda rasakan..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            className="bg-teal-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Konfirmasi Jadwal
                        </button>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSuccess(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Janji Temu Terkonfirmasi!</h2>
                            <p className="text-slate-600 mb-6">
                                Jadwal Anda dengan {formData.doctor || 'Dokter'} telah berhasil dibuat. Silakan cek email Anda untuk detailnya.
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                            >
                                Tutup
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Konsultasi;
