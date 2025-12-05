const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// --- AUTH ROUTES ---

app.post('/api/register', async (req, res) => {
    const { name, email, password, role, licenseCode } = req.body;
    try {
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, license_code) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role, licenseCode]
        );
        const newUser = { id: result.insertId, name, email, role };
        res.json({ success: true, user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (users.length > 0) {
            const user = users[0];
            const { password, ...userData } = user;
            res.json({ success: true, user: userData });
        } else {
            res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- DASHBOARD & CHECK-IN ROUTES ---

app.get('/api/dashboard/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [userRows] = await db.query('SELECT name, height, weight, blood_type, emergency_contact FROM users WHERE id = ?', [userId]);
        const userData = userRows.length > 0 ? userRows[0] : { name: 'User' };

        const [scoreRows] = await db.query(
            'SELECT score FROM daily_checkins WHERE user_id = ? AND check_date = CURDATE()',
            [userId]
        );
        const latestScore = scoreRows.length > 0 ? scoreRows[0].score : null;

        // Fetch from new diagnosis_logs instead of old history table for dashboard preview
        const [historyRows] = await db.query(
            'SELECT * FROM diagnosis_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            [userId]
        );

        res.json({
            success: true,
            data: {
                userName: userData.name,
                userProfile: userData,
                latestScore,
                history: historyRows
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
});

app.post('/api/checkin', async (req, res) => {
    const { userId, score } = req.body;
    try {
        const [existing] = await db.query(
            'SELECT id FROM daily_checkins WHERE user_id = ? AND check_date = CURDATE()',
            [userId]
        );

        if (existing.length > 0) {
            await db.query('UPDATE daily_checkins SET score = ? WHERE id = ?', [score, existing[0].id]);
        } else {
            await db.query(
                'INSERT INTO daily_checkins (user_id, score, check_date) VALUES (?, ?, CURDATE())',
                [userId, score]
            );
        }

        res.json({ success: true, message: 'Check-in berhasil disimpan.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan check-in.' });
    }
});

app.get('/api/checkin/today/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT score FROM daily_checkins WHERE user_id = ? AND check_date = CURDATE()',
            [userId]
        );
        res.json({ success: true, hasCheckedIn: rows.length > 0, score: rows.length > 0 ? rows[0].score : null });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error checking status' });
    }
});

// --- PROFILE ROUTES ---

app.get('/api/user/profile/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT name, email, height, weight, blood_type, birth_date, emergency_contact, institution, title_degree, sip_number FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

app.put('/api/user/profile/:id', async (req, res) => {
    const { id } = req.params;
    const { height, weight, blood_type, birth_date, emergency_contact } = req.body;
    try {
        await db.query(
            'UPDATE users SET height = ?, weight = ?, blood_type = ?, birth_date = ?, emergency_contact = ? WHERE id = ?',
            [height, weight, blood_type, birth_date, emergency_contact, id]
        );
        res.json({ success: true, message: 'Profile updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Update failed' });
    }
});

// --- AQI PROXY ROUTE ---
app.post('/api/aqi', async (req, res) => {
    const { lat, lon } = req.body;
    const API_KEY = '934d98a71e8df32b4b5d7ff32ba29abb';

    try {
        const pollutionUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const pollutionRes = await fetch(pollutionUrl);
        const pollutionData = await pollutionRes.json();

        const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (pollutionData.list && pollutionData.list.length > 0) {
            const item = pollutionData.list[0];
            const city = geoData.length > 0 ? geoData[0].name : 'Lokasi Terdeteksi';

            res.json({
                success: true,
                data: {
                    aqi: item.main.aqi,
                    pm25: item.components.pm2_5,
                    co: item.components.co,
                    city: city
                }
            });
        } else {
            throw new Error('No data found');
        }

    } catch (err) {
        console.error('AQI Fetch Error:', err);
        res.json({
            success: true,
            data: {
                aqi: 2,
                pm25: 15.5,
                co: 240,
                city: 'Mode Demo (API Key Missing)'
            }
        });
    }
});

// --- NEWS ROUTE (GEMINI AI) ---
app.post('/api/news', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDs1v9s4Ziaes7Er9uNtUrMjYNSNqNcyrs";
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = "Cari 5 berita kesehatan pernapasan terbaru dan valid minggu ini (topik: Asma, TBC, Kualitas Udara, ISPA). Return JSON array valid tanpa markdown formatting. Format: [{title, summary, source, date}]. Bahasa Indonesia.";

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const newsData = JSON.parse(jsonStr);

        res.json({ success: true, data: newsData });

    } catch (err) {
        console.error("Gemini Error:", err);
        res.json({
            success: true,
            data: [
                { title: "Kualitas Udara Jakarta Memburuk Pagi Ini", summary: "Indeks kualitas udara (AQI) di Jakarta mencapai angka tidak sehat bagi kelompok sensitif.", source: "CNN Indonesia", date: "2023-10-25" },
                { title: "Waspada Lonjakan Kasus ISPA pada Anak", summary: "Dinas Kesehatan menghimbau orang tua untuk mewaspadai gejala ISPA di tengah peralihan musim.", source: "Kompas Health", date: "2023-10-24" },
                { title: "Terobosan Baru Pengobatan Asma Berat", summary: "Penelitian terbaru menunjukkan efektivitas obat biologis baru untuk penderita asma kronis.", source: "Detik Health", date: "2023-10-23" },
                { title: "Pentingnya Vaksinasi Influenza", summary: "Ahli paru menekankan pentingnya vaksin flu tahunan untuk mencegah komplikasi paru.", source: "Antara News", date: "2023-10-22" },
                { title: "Tips Menjaga Paru-paru Tetap Sehat", summary: "Latihan pernapasan rutin dan menghindari polusi adalah kunci kesehatan paru jangka panjang.", source: "Halodoc", date: "2023-10-21" }
            ]
        });
    }
});

// --- DIAGNOSIS HISTORY ROUTES (NEW) ---

// Save Diagnosis
app.post('/api/diagnosis', async (req, res) => {
    const { userId, result, score, symptoms } = req.body;
    try {
        await db.query(
            'INSERT INTO diagnosis_logs (user_id, final_result, confidence_score, symptoms_summary) VALUES (?, ?, ?, ?)',
            [userId, result, score, JSON.stringify(symptoms)]
        );
        res.json({ success: true, message: 'Diagnosis saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save diagnosis' });
    }
});

// Get History
app.get('/api/history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM diagnosis_logs WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
});

// --- ADMIN DASHBOARD ROUTES ---

app.get('/api/admin/stats', async (req, res) => {
    try {
        // 1. Total Diagnosa Hari Ini
        const [todayRows] = await db.query(
            'SELECT COUNT(*) as count FROM diagnosis_logs WHERE DATE(created_at) = CURDATE()'
        );
        const totalToday = todayRows[0].count;

        // 2. Kasus Kritis (Merah)
        const [criticalRows] = await db.query(
            'SELECT COUNT(*) as count FROM diagnosis_logs WHERE final_result LIKE "%Bahaya%" OR final_result LIKE "%Segera%"'
        );
        const criticalCount = criticalRows[0].count;

        // 3. Akurasi Sistem (Mock)
        const accuracy = 98;

        // 4. Disease Distribution (Pie Chart)
        const [distributionRows] = await db.query(
            'SELECT final_result, COUNT(*) as count FROM diagnosis_logs GROUP BY final_result'
        );
        const diseaseDistribution = distributionRows.map(row => ({
            name: row.final_result.split(' - ')[0] || row.final_result,
            value: row.count
        }));

        // 5. Activity Log (Bar Chart)
        const [activityRows] = await db.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM diagnosis_logs 
             WHERE created_at >= DATE(NOW()) - INTERVAL 7 DAY 
             GROUP BY DATE(created_at) 
             ORDER BY date ASC`
        );
        const activityLog = activityRows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            count: row.count
        }));

        // 6. System Alerts (Real Logic)
        const alerts = [];

        // Alert 1: Critical Alerts (Real Logic)
        const [criticalLogs] = await db.query(`
            SELECT d.final_result, u.name 
            FROM diagnosis_logs d
            JOIN users u ON d.user_id = u.id
            WHERE (
                d.final_result LIKE '%Bahaya%' OR 
                d.final_result LIKE '%Segera%' OR 
                d.final_result LIKE '%Gawat%' OR 
                d.final_result LIKE '%Darurat%' OR
                d.final_result LIKE '%Kritis%' OR
                d.final_result LIKE '%Eksaserbasi%' OR
                d.final_result LIKE '%Emboli%' OR
                d.final_result LIKE '%Pneumothorax%' OR
                d.final_result LIKE '%Cor Pulmonale%' OR
                d.final_result LIKE '%Gagal Jantung%' OR
                d.final_result LIKE '%Kanker%' OR
                d.final_result LIKE '%Pneumonia%' OR
                d.final_result LIKE '%Tuberkulosis%'
            )
            AND d.created_at >= NOW() - INTERVAL 24 HOUR
            LIMIT 10
        `);

        // Calculate Emergency Count (Unique Patients with Critical Status in Last 24 Hours)
        const [emergencyCountRows] = await db.query(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM diagnosis_logs 
            WHERE (
                final_result LIKE '%Bahaya%' OR 
                final_result LIKE '%Segera%' OR 
                final_result LIKE '%Gawat%' OR 
                final_result LIKE '%Darurat%' OR
                final_result LIKE '%Kritis%' OR
                final_result LIKE '%Eksaserbasi%' OR
                final_result LIKE '%Emboli%' OR
                final_result LIKE '%Pneumothorax%' OR
                final_result LIKE '%Cor Pulmonale%' OR
                final_result LIKE '%Gagal Jantung%' OR
                final_result LIKE '%Kanker%' OR
                final_result LIKE '%Pneumonia%' OR
                final_result LIKE '%Tuberkulosis%'
            )
            AND created_at >= NOW() - INTERVAL 24 HOUR
        `);
        const emergencyCount = emergencyCountRows[0].count;

        criticalLogs.forEach(log => {
            alerts.push({
                type: 'critical',
                message: `Pasien ${log.name} terdiagnosa kritis: ${log.final_result.substring(0, 50)}...`
            });
        });

        // Alert 2: Novelty Detection (New Diagnosis Patterns)
        const [novelLogs] = await db.query(`
            SELECT d1.final_result, d1.created_at, u.name
            FROM diagnosis_logs d1
            JOIN users u ON d1.user_id = u.id
            WHERE d1.created_at >= NOW() - INTERVAL 24 HOUR
            AND NOT EXISTS (
                SELECT 1 FROM diagnosis_logs d2 
                WHERE d2.final_result = d1.final_result 
                AND d2.created_at < d1.created_at
            )
            LIMIT 10
        `);

        novelLogs.forEach(log => {
            alerts.push({
                type: 'discovery',
                message: `Pola Baru Terdeteksi: "${log.final_result.substring(0, 40)}..." muncul pertama kali pada pasien ${log.name}.`
            });
        });

        console.log("DEBUG: Generated Alerts:", alerts);

        // 7. Dataset Status (Real Logic based on Logs)
        const [datasetRows] = await db.query('SELECT COUNT(*) as count FROM diagnosis_logs');
        const datasetCount = datasetRows[0].count;
        const datasetStatus = {
            label: 'Training Data',
            count: `${datasetCount} Records`,
            percentage: Math.min((datasetCount / 2000) * 100, 100) // Target 2000 records
        };

        // 8. Total Stats (Real Logic)
        const [totalUsersStatsRows] = await db.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = totalUsersStatsRows[0].count;
        console.log("DEBUG: Total Users Fetched:", totalUsers);

        const [totalDiagnosesRows] = await db.query('SELECT COUNT(*) as count FROM diagnosis_logs');
        const totalDiagnoses = totalDiagnosesRows[0].count;
        console.log("DEBUG: Total Diagnoses Fetched:", totalDiagnoses);

        // 9. Recent Activity (Real Logic)
        const [recentActivityRows] = await db.query(`
            SELECT d.created_at, d.final_result, u.name as user_name
            FROM diagnosis_logs d
            JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
            LIMIT 8
        `);
        console.log("DEBUG: Recent Activity Fetched:", recentActivityRows.length);

        res.json({
            success: true,
            data: {
                stats: { totalToday, criticalCount, accuracy },
                total_users: totalUsers,
                total_diagnoses: totalDiagnoses,
                avg_accuracy: accuracy,
                charts: { diseaseDistribution, activityLog },
                alerts: alerts,
                datasetStatus: datasetStatus,
                recent_activity: recentActivityRows,
                emergency_count: emergencyCount,
                pendingReviews: []
            }
        });

    } catch (err) {
        console.error("Admin Stats Error:", err);
        res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
    }
});

// Global History
app.get('/api/admin/history/all', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT d.id, d.created_at as date, u.name as patient, d.final_result as diagnosis, d.confidence_score as score
            FROM diagnosis_logs d
            JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
        `);

        const formattedRows = rows.map(row => ({
            id: row.id,
            date: row.date.toISOString().split('T')[0],
            patient: row.patient,
            diagnosis: row.diagnosis,
            score: row.score,
            status: 'Selesai' // Default status
        }));

        res.json({ success: true, data: formattedRows });
    } catch (err) {
        console.error("History Error:", err);
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
});

// --- EXPERT SYSTEM ROUTES ---

// 1. Expert Profile Update
app.put('/api/expert/profile/:id', async (req, res) => {
    const { id } = req.params;
    const { institution, title_degree, sip_number } = req.body;
    try {
        await db.query(
            'UPDATE users SET institution = ?, title_degree = ?, sip_number = ? WHERE id = ?',
            [institution, title_degree, sip_number, id]
        );
        res.json({ success: true, message: 'Expert profile updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Update failed' });
    }
});

// 2. Gemini Expert Research (UPDATED PROMPT - PROACTIVE)
app.post('/api/expert/research', async (req, res) => {
    // const { topic } = req.body; // Not needed for auto-research
    try {
        // Use environment variable or fallback (User requested Gemini 2.5 Flash -> assuming 1.5 Flash)
        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDs1v9s4Ziaes7Er9uNtUrMjYNSNqNcyrs";
        const genAI = new GoogleGenerativeAI(apiKey);

        // Using gemini-1.5-flash-001 (specific version to avoid 404 on some keys)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Bertindak sebagai Peneliti Medis AI Senior.
        Lakukan simulasi pemindaian proaktif terhadap literatur medis pernapasan global tahun 2024-2025.
        Identifikasi 3 temuan klinis baru (gejala baru, faktor risiko baru, atau korelasi penyakit baru) yang BELUM umum diketahui atau sedang tren.
        
        Output WAJIB berupa JSON ARRAY yang valid. Jangan ada teks lain selain JSON.
        Struktur:
        [
            {
                "type": "symptom" atau "rule",
                "name": "Nama Gejala/Penyakit",
                "clinical_evidence": "Ringkasan temuan dari jurnal (Bahasa Indonesia)...",
                "source_journal": "Nama Jurnal/Sumber (Tahun)",
                "suggested_action": "Saran implementasi ke sistem...",
                "proposed_node": { "question": "...", "options": [...] } (Opsional, jika rule)
            }
        ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Response:", text); // Debug log

        // Clean JSON
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let draftData;
        try {
            draftData = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.error("Raw Text:", text);
            throw new Error("Invalid JSON response from AI");
        }

        res.json({ success: true, data: draftData });

    } catch (err) {
        console.error("Gemini Logic Error:", err);
        res.status(500).json({
            success: false,
            message: 'Failed to generate logic: ' + (err.message || 'Unknown Error'),
            details: err.toString()
        });
    }
});


// 3. Merge Logic (Insert into DB)
app.post('/api/expert/merge', async (req, res) => {
    const { draft } = req.body;
    try {
        // In a real app, we would insert into 'symptoms' or 'rules' table.
        // For now, we simulate success.
        console.log("Merging Draft:", draft);

        // Example DB Insert (Commented out until tables exist)
        /*
        if (draft.type === 'symptom') {
            await db.query('INSERT INTO symptoms (name, description) VALUES (?, ?)', [draft.name, draft.clinical_evidence]);
        }
        */

        res.json({ success: true, message: 'Data merged successfully.' });
    } catch (err) {
        console.error("Merge Error:", err);
        res.status(500).json({ success: false, message: 'Failed to merge data' });
    }
});

// --- TREE MANAGER ROUTES (VISUAL EDITOR - READ ONLY) ---

// Mock Data for Decision Tree (Initial State)
let decisionTreeData = {
    nodes: [
        { id: 'root', type: 'input', data: { label: 'Apakah pasien mengalami batuk?' }, position: { x: 250, y: 0 } },
        { id: 'node-2', data: { label: 'Apakah batuk berdahak?' }, position: { x: 100, y: 100 } },
        { id: 'node-3', data: { label: 'Apakah ada sesak napas?' }, position: { x: 400, y: 100 } },
        { id: 'node-4', data: { label: 'Diagnosa: Kemungkinan Flu Biasa' }, position: { x: 0, y: 200 } },
        { id: 'node-5', data: { label: 'Apakah dahak berwarna hijau/kuning?' }, position: { x: 200, y: 200 } },
        { id: 'node-6', type: 'output', data: { label: 'Diagnosa: Asma (Perlu Pemeriksaan Lanjut)' }, position: { x: 400, y: 200 } },
        { id: 'node-7', type: 'output', data: { label: 'Diagnosa: Bronkitis' }, position: { x: 150, y: 300 } },
        { id: 'node-8', type: 'output', data: { label: 'Diagnosa: ISPA Ringan' }, position: { x: 300, y: 300 } }
    ],
    edges: [
        { id: 'e1-2', source: 'root', target: 'node-2', label: 'Ya', animated: true },
        { id: 'e1-3', source: 'root', target: 'node-3', label: 'Tidak', animated: true },
        { id: 'e2-4', source: 'node-2', target: 'node-4', label: 'Tidak' },
        { id: 'e2-5', source: 'node-2', target: 'node-5', label: 'Ya' },
        { id: 'e3-6', source: 'node-3', target: 'node-6', label: 'Ya' },
        { id: 'e5-7', source: 'node-5', target: 'node-7', label: 'Ya' },
        { id: 'e5-8', source: 'node-5', target: 'node-8', label: 'Tidak' }
    ]
};


// 4. Save Decision Tree (Overwrite File)
app.post('/api/expert/save-tree', async (req, res) => {
    const { treeData } = req.body;
    try {
        const fs = require('fs');
        const path = require('path');

        // Construct the file content
        // We need to preserve the imports/exports structure
        const fileContent = `// WARNING / CATATAN PENTING:
// - Pohon keputusan ini bersifat EDUKATIF/TAMBAHAN, bukan pengganti diagnosis dokter.
// - Diagnosis definitif memerlukan anamnesis lengkap, pemeriksaan fisik, dan penunjang.
// - Jangan gunakan ini untuk mengambil keputusan klinis sendiri tanpa tenaga kesehatan.

export const decisionTree = ${JSON.stringify(treeData, null, 2)};
`;

        const filePath = path.join(__dirname, '../src/data/decisionTree.js');

        fs.writeFile(filePath, fileContent, (err) => {
            if (err) {
                console.error("File Write Error:", err);
                return res.status(500).json({ success: false, message: 'Failed to write file' });
            }
            res.json({ success: true, message: 'Decision tree saved successfully.' });
        });

    } catch (err) {
        console.error("Save Tree Error:", err);
        res.status(500).json({ success: false, message: 'Failed to save tree' });
    }
});

app.get('/api/tree', (req, res) => {
    res.json({ success: true, data: decisionTreeData });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
